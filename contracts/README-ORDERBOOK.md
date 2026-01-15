# GreenXAI Orderbook & Faucet

## Why an Orderbook Exists

### Difference Between AMM and Orderbook

| Feature | AMM (Constant Product) | Orderbook |
|---------|------------------------|-----------|
| Price discovery | Algorithmic (x·y=k) | User-defined limit orders |
| Slippage | Variable based on trade size | Zero (exact price execution) |
| Liquidity source | LP deposits | Maker orders |
| Capital efficiency | Lower (distributed across curve) | Higher (concentrated at prices) |
| Best for | Retail swaps, continuous liquidity | Large orders, specific prices |

### Use Cases for Fixed-Price Trading

The orderbook complements the AMM by enabling:

- **Institutional orders** — Large trades at specific prices without market impact
- **Price targeting** — Buy/sell exactly at desired price points
- **Arbitrage** — Correct price discrepancies between AMM and orderbook
- **RFQ-style trading** — Post offers and wait for counterparties
- **Predictable execution** — Know exact cost before committing capital

---

## Orderbook Architecture

### Buy vs Sell Orders

**Buy Orders** (`isBuy = true`):
- Maker wants to acquire green credits
- Maker locks mUSDC in escrow
- Taker delivers credits and receives mUSDC

**Sell Orders** (`isBuy = false`):
- Maker wants to sell green credits
- Maker locks ERC-1155 credits in escrow
- Taker delivers mUSDC and receives credits

### Order Structure

Each order contains:

| Field | Description |
|-------|-------------|
| `orderId` | Unique identifier |
| `maker` | Address that created the order |
| `tokenId` | ERC-1155 credit type being traded |
| `isBuy` | Direction (true = buying credits) |
| `price` | Price per credit in mUSDC base units |
| `amount` | Total credits to trade |
| `filled` | Amount already executed |
| `timestamp` | Order creation time |
| `expiration` | Optional deadline (0 = no expiry) |
| `minAmountOut` | Slippage tolerance parameter |
| `referrer` | Optional address for fee sharing |

### Escrow Mechanism

When placing an order:

**Buy order:** mUSDC is transferred from maker to contract
```
mUSDC.safeTransferFrom(maker, orderbook, price × amount)
escrowedmUSDCByOrder[orderId] = cost
mUSDCEscrowed[maker] += cost
```

**Sell order:** Credits are transferred from maker to contract
```
credits.safeTransferFrom(maker, orderbook, tokenId, amount)
escrowedCreditsByOrder[orderId] = amount
creditsEscrowed[maker][tokenId] += amount
```

Escrow ensures makers cannot double-spend while orders are active.

### Stablecoin Settlement

All trades settle in `mUSDC` (Mock USDC):

- 6 decimal precision matches real USDC
- Configurable via `setmUSDC()` for production deployment
- Default: Sepolia mUSDC address hardcoded

### Partial Fills and Cancellation

**Partial fills:**
- `fillOrder(orderId, fillAmount)` allows filling less than the full order
- `filled` counter tracks cumulative execution
- Order remains active until `filled >= amount`

**Cancellation:**
- `cancelOrder(orderId)` returns escrowed assets
- Only maker or MANAGER_ROLE can cancel
- Cannot cancel fully filled orders

---

## Security & Accounting

### Reentrancy Protection

The contract uses OpenZeppelin's `ReentrancyGuard`:

- `nonReentrant` modifier on `placeOrder`, `cancelOrder`, `fillOrder`
- Prevents cross-function reentrancy during escrow operations
- Critical because contract handles both ERC-20 and ERC-1155 transfers

### Escrow Tracking

Dual-level tracking ensures accurate accounting:

**Order-level:**
- `escrowedmUSDCByOrder[orderId]` — mUSDC locked for specific order
- `escrowedCreditsByOrder[orderId]` — Credits locked for specific order

**User-level:**
- `mUSDCEscrowed[user]` — Total mUSDC locked by user across orders
- `creditsEscrowed[user][tokenId]` — Total credits locked by user

Both levels are updated atomically during order operations.

### Safe ERC-20 / ERC-1155 Transfers

The contract uses OpenZeppelin's `SafeERC20`:

- `safeTransferFrom` for mUSDC operations
- Handles non-standard ERC-20 return values
- Reverts on failed transfers

ERC-1155 operations use:
- `safeTransferFrom` with data parameter
- Contract implements `IERC1155Receiver` interface
- Proper selector returns for `onERC1155Received`

### Pausable Controls

The contract inherits `Pausable` for emergency stops:

| Function | When Paused |
|----------|-------------|
| `placeOrder` | Blocked |
| `fillOrder` | Blocked |
| `cancelOrder` | Allowed (users can recover funds) |

Only `MANAGER_ROLE` can pause/unpause.

### Access Control

The contract uses role-based access:

| Role | Capabilities |
|------|--------------|
| `DEFAULT_ADMIN_ROLE` | Grant/revoke roles |
| `MANAGER_ROLE` | Pause, configure mUSDC, withdraw fees, force-cancel |

---

## MockUSDC Faucet

### Why a Faucet is Needed

Testnet deployments require users to have tokens for testing:

- New users need mUSDC to place buy orders
- Developers need tokens for integration testing
- Demo environments require self-service token acquisition

### Faucet Features

The `MockUSDC` contract includes a public faucet:

| Parameter | Value |
|-----------|-------|
| `faucetAmount` | 10,000 mUSDC per claim |
| `faucetCooldown` | 2 minutes between claims |
| Initial supply | 100,000,000 mUSDC to deployer |

**Claiming:**
```
faucet() external
```
- Mints `faucetAmount` to caller
- Records `lastFaucetClaim[msg.sender]`
- Enforces cooldown between claims

**Checking eligibility:**
```
getFaucetInfo(user) returns (timestamp, canClaim, waitTime)
```

### Separation from Production Logic

The faucet is intentionally in a separate contract (`MockUSDC`) that:

- Would be replaced by real USDC in production
- Contains no business logic for the trading system
- Can be swapped via `setmUSDC()` on the orderbook
- Includes owner-only mint/burn for testing flexibility

---

## How Orderbook Fits GreenXAI

### Complements AMM

Users choose the optimal venue:

| Scenario | Best Venue |
|----------|------------|
| Quick swap, any price | AMM |
| Large order, specific price | Orderbook |
| Providing liquidity | AMM |
| Price-sensitive execution | Orderbook |
| Small retail trades | AMM |
| Institutional block trades | Orderbook |

### Improves Price Discovery

The orderbook contributes to efficient markets:

- Limit orders express price expectations
- Visible order depth shows supply/demand
- Arbitrageurs align AMM and orderbook prices
- Price levels indexed by `activePricesPerToken` and `ordersAtPrice`

### Supports Institutional-Style Trading

Features designed for larger participants:

- **Order expiration** — Time-limited offers
- **Partial fills** — Execute in chunks
- **Exact pricing** — No slippage uncertainty
- **Referrer field** — Fee sharing for brokers/integrators
- **Manager controls** — Compliance and emergency capabilities

---

## Trading Flow Summary

### Placing a Buy Order

```
1. User approves mUSDC for orderbook
2. User calls placeOrder(tokenId, isBuy=true, price, amount, ...)
3. mUSDC transferred to orderbook escrow
4. Order indexed by price level
5. Event emitted: OrderPlaced
```

### Filling a Buy Order (Taker Sells)

```
1. Taker approves credits for orderbook
2. Taker calls fillOrder(orderId, fillAmount)
3. Credits transferred from taker to maker
4. mUSDC released from escrow to taker
5. Event emitted: OrderMatched
```

### Cancelling an Order

```
1. Maker calls cancelOrder(orderId)
2. Escrowed assets returned to maker
3. Order removed from price index
4. Event emitted: OrderCancelled
```
