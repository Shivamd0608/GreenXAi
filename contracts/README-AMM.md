# GreenAiDEX AMM System (Uniswap V2 Style)

## Overview

The GreenAiDEX Automated Market Maker (AMM) enables permissionless, on-chain trading of tokenized green credits. It solves the liquidity fragmentation problem inherent in environmental asset markets by allowing any participant to provide liquidity and execute trades without relying on traditional market makers.

The Uniswap V2 model was chosen for several reasons:

- **Battle-tested architecture** — The V2 design has secured billions in value across multiple chains
- **Composability** — Factory-based pair deployment allows integration with any ERC-20 token
- **Capital efficiency** — Constant product model ensures liquidity at all price points
- **Simplicity** — Straightforward mechanics reduce attack surface and audit complexity

---

## Architecture

### Factory Contract (`GreenXchangeV2Factory`)

The Factory serves as the registry and deployer for all trading pairs:

- Maintains a mapping of token pair addresses to deployed Pair contracts
- Prevents duplicate pair creation through address sorting (tokenA < tokenB)
- Emits `PairCreated` events for off-chain indexing
- Provides `allPairs` array for enumeration

The Factory does not hold funds or execute trades—it only manages Pair deployment.

### Pair Contract (`GreenXchangeV2Pair`)

Each Pair is an independent ERC-20 token representing liquidity provider (LP) shares:

- Holds reserves of exactly two ERC-20 tokens
- Implements the constant product invariant for swaps
- Mints LP tokens proportional to liquidity contribution
- Burns LP tokens when liquidity is withdrawn
- Tracks reserves using `uint112` for gas optimization

The Pair contract is the core settlement layer where all swaps and liquidity operations execute.

### Router Contract (`GreenXchangeV2Router`)

The Router provides a user-friendly interface for interacting with Pairs:

- Calculates optimal amounts for liquidity provision
- Handles multi-hop swap routing through token paths
- Enforces deadline and slippage parameters
- Manages token ordering when interacting with Pairs
- Never holds user funds (stateless intermediary)

Users interact with the Router; the Router interacts with Pairs.

---

## Core Mechanics

### Constant Product Formula

All swaps preserve the invariant:

$$
x \cdot y = k
$$

Where:
- $x$ = reserve of token0
- $y$ = reserve of token1  
- $k$ = constant (increases only from fees)

This ensures that larger trades move the price more significantly, creating natural slippage protection.

### Liquidity Provision

Liquidity providers deposit both tokens in the current reserve ratio:

1. Tokens are transferred to the Pair contract
2. LP tokens are minted proportional to the contribution:
   - First deposit: $\text{LP} = \sqrt{x \cdot y} - 1000$
   - Subsequent deposits: $\text{LP} = \min\left(\frac{\Delta x}{x}, \frac{\Delta y}{y}\right) \cdot \text{totalSupply}$

### LP Tokens

LP tokens are standard ERC-20 tokens (`GX-LP`) that:

- Represent proportional ownership of pool reserves
- Accrue trading fees automatically (reserves grow, LP supply stays constant)
- Can be transferred, staked, or used in other DeFi protocols
- Are burned when liquidity is withdrawn

### Swap Execution

Swaps follow the "transfer-then-call" pattern:

1. User transfers input tokens to the Pair
2. Router calls `swap()` specifying desired output amounts
3. Pair validates the constant product invariant (with fees)
4. Output tokens are transferred to the recipient

### Fee Mechanism

A 0.3% fee is applied to all swaps:

- Fee is taken from the input amount
- Effective multiplier: 997/1000 for input amounts
- Fees remain in the pool, increasing $k$ over time
- LP providers capture fees proportional to their share

---

## How GreenAiDEX Uses the AMM

### ERC-20 Wrapped Green Credits

The AMM only supports ERC-20 tokens. Since green credits are ERC-1155 tokens (`GreenCreditToken`), they must first be wrapped using `WrappedGreenCredit` contracts. This creates 1:1 backed ERC-20 representations suitable for AMM trading.

### Stablecoin Pairs

Primary trading pairs use `MockUSDC` as the quote currency:

- Carbon Credits ↔ mUSDC
- Renewable Energy Credits ↔ mUSDC
- Water Credits ↔ mUSDC
- Green Credits ↔ mUSDC

This provides price discovery in familiar USD terms.

### Cross-Credit Pools

The system supports direct credit-to-credit pairs:

- Carbon ↔ Renewable
- Water ↔ Carbon
- Any wrapped credit ↔ Any other wrapped credit

These pools enable efficient rebalancing without routing through stablecoins.

---

## Security & Design Choices

### Minimum Liquidity Lock

The first 1000 LP tokens are permanently locked (sent to a dead address):

- Prevents the "first depositor" attack
- Ensures pools can never be fully drained
- OpenZeppelin v5 compatibility (cannot mint to address(0))

### Slippage Protection

The Router enforces minimum output amounts:

- `amountOutMin` parameter on all swap functions
- `amountAMin` / `amountBMin` on liquidity removal
- Reverts with `SLIPPAGE_TOO_HIGH` if not met

### Deadline Usage

All Router functions include a `deadline` parameter:

- Transactions revert if `block.timestamp > deadline`
- Protects against transaction ordering attacks
- Prevents stale transactions from executing at unfavorable prices

### Reentrancy Protection

Both Pair and Router use OpenZeppelin's `ReentrancyGuard`:

- `nonReentrant` modifier on all state-changing functions
- Protects against cross-function reentrancy
- Critical for `mint`, `burn`, `swap`, `sync`, and `skim` operations

### Additional Safety Features

- **Sync function** — Allows emergency reserve reconciliation with actual balances
- **Skim function** — Recovers tokens sent directly to the Pair (not through swap)
- **Overflow checks** — Reserves capped at `uint112.max`
- **Zero address validation** — Prevents accidental burns through router operations
