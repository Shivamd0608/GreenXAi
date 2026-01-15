# GreenAiDEX Credit Registration, Minting & Wrapping

## Problem Being Solved

Real-world green credits (carbon offsets, renewable energy certificates, water credits) need to be represented on-chain in a way that:

1. Preserves distinct credit types and project metadata
2. Enables batch operations and fractional holdings
3. Maintains regulatory compliance through controlled minting
4. Allows trading on DeFi infrastructure (AMMs, lending, etc.)

### Why ERC-1155

The `GreenCreditToken` contract uses ERC-1155 for green credits because:

- **Multi-token support** — A single contract manages all credit types (Carbon, Green, Water, Renewable)
- **Batch transfers** — Reduces gas costs for portfolios with multiple credit types
- **Metadata flexibility** — Each token ID carries its own project metadata
- **Fractional compatibility** — Natural fit for divisible environmental assets

### Why Registration and Minting Are Separated

The two-phase approach (register → approve → mint) exists because:

- **Verification requirement** — Real-world credits must be validated before tokenization
- **Supply control** — Prevents unauthorized inflation of credit supply
- **Audit trail** — Clear separation of who registered vs. who authorized minting
- **Regulatory alignment** — Mirrors traditional credit issuance workflows

---

## Credit Registration Flow

### User Submits Credit Metadata

Any address can call `registerCredit()` with:

| Parameter | Description |
|-----------|-------------|
| `tokenId` | Unique identifier for this credit (user-chosen) |
| `creditType` | Enum: `Green`, `Carbon`, `Water`, or `Renewable` |
| `projectTitle` | Project name (1-30 characters) |
| `location` | Geographic location string |
| `certificateHash` | IPFS/document hash (46-128 characters) |

### On-Chain Storage

The contract stores a `CreditInfo` struct:

```
CreditInfo {
    creditType      // Green, Carbon, Water, Renewable
    projectTitle    // Human-readable name
    location        // Geographic identifier
    certificateHash // Off-chain verification link
    registrar       // Address that registered the credit
    exists          // Whether token ID is registered
    revoked         // Whether credit is invalidated
}
```

### No Minting During Registration

Registration creates the credit record but mints zero tokens. This allows:

- Off-chain verification before any tokens exist
- Multiple approvals for the same credit type
- Audit of registration vs. minting activity

---

## Approval & Minting

### Owner-Controlled Mint Approval

Only the contract owner can approve minting via `approveMint()`:

| Parameter | Description |
|-----------|-------------|
| `user` | Address authorized to mint |
| `tokenId` | Which credit type to mint |
| `amount` | Maximum mintable quantity |
| `expiryTimestamp` | Deadline after which approval expires |

### Per-User, Per-Token Mint Limits

Each approval is scoped to:

- **Specific user** — Approval is non-transferable
- **Specific token ID** — Cannot mint other credit types
- **Specific amount** — Hard cap on mintable quantity
- **Specific timeframe** — Approval expires automatically

### Expiry-Based Approvals

The `MintApproval` struct tracks:

```
MintApproval {
    amount  // Remaining mintable amount
    expiry  // Unix timestamp deadline
}
```

Users must mint before expiry. Partial mints reduce the remaining `amount`.

### Minting Safety Guarantees

The `mintApprovedToken()` function enforces:

1. Credit must exist (`exists == true`)
2. Credit must not be revoked (`revoked == false`)
3. User's tokens must not be frozen
4. Approval must have remaining amount
5. Current time must be before expiry
6. Requested amount must not exceed approval

---

## ERC-1155 → ERC-20 Wrapping

### Purpose of Wrapping

DeFi protocols (AMMs, lending markets, vaults) typically require ERC-20 tokens. Wrapping converts ERC-1155 credits into ERC-20 representations to enable:

- AMM trading via `GreenXchangeV2Router`
- Liquidity provision to trading pairs
- Integration with broader DeFi ecosystem
- Standard wallet/UI compatibility

### Factory-Based Wrapper Deployment

The `WrappedGreenCreditFactory` deploys wrapper contracts:

1. User calls `createWrapper(greenCredit, tokenId, name, symbol)`
2. Factory deploys a new `WrappedGreenCredit` contract
3. Factory records the wrapper address in `wrapperOf[greenCredit][tokenId]`
4. Factory emits `WrapperCreated` event

### One Wrapper Per Credit Type

Each ERC-1155 token ID gets exactly one ERC-20 wrapper:

- `wrapperOf[greenCredit][tokenId]` returns the wrapper address
- Attempting to create a duplicate reverts with "wrapper already exists"
- `allWrappers` array provides enumeration

### 1:1 Backing Guarantee

The `WrappedGreenCredit` contract maintains strict backing:

**Wrapping (ERC-1155 → ERC-20):**
1. User approves wrapper for ERC-1155 transfers
2. User calls `wrap(amount)`
3. ERC-1155 tokens transfer to wrapper contract
4. Wrapper mints `amount * 10^18` ERC-20 tokens to user

**Unwrapping (ERC-20 → ERC-1155):**
1. User calls `unwrap(amount)` where amount is divisible by 10^18
2. Wrapper burns the ERC-20 tokens
3. Wrapper transfers corresponding ERC-1155 back to user

The 10^18 multiplier converts integer credit units to 18-decimal ERC-20 representation.

---

## Design & Security Considerations

### Access Control

| Role | Capabilities |
|------|--------------|
| Owner | Approve mints, revoke credits, freeze tokens |
| Registrar | Register new credit types (anyone) |
| Approved User | Mint up to approved amount |
| Token Holder | Transfer, wrap, retire tokens |

### Revocation and Freezing

**Credit-level revocation** (`revokeCredit`):
- Marks entire token ID as invalid
- Prevents all future minting
- Blocks transfers of that credit type
- Reversible via `unrevokeCredit`

**User-level freezing** (`freezeUserToken`):
- Blocks specific user from transferring specific token ID
- Does not affect other users
- Does not affect other token IDs held by same user
- Reversible via `unfreezeUserToken`

### Supply Tracking

The contract maintains accurate supply metrics:

- `totalSupply[tokenId]` — Current circulating supply
- `totalRetired[tokenId]` — Cumulative burned/retired amount
- Both updated atomically during mint and retire operations

### Retirement (Burning) of Credits

The `retire()` function allows permanent credit destruction:

1. Caller must hold sufficient balance
2. Credit must not be revoked
3. Caller's tokens must not be frozen
4. Tokens are burned via ERC-1155 `_burn`
5. `totalSupply` decreases, `totalRetired` increases
6. `TokenRetired` event includes optional `reason` string

Retirement is irreversible and represents actual environmental offset claims.

---

## Credit Lifecycle Summary

```
┌─────────────────┐
│  Registration   │  Anyone can register credit metadata
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verification   │  Off-chain validation of real-world credit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mint Approval  │  Owner approves specific user/amount/expiry
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Minting      │  User mints ERC-1155 tokens
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Wrapping     │  Convert to ERC-20 for DeFi
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AMM Trading    │  Trade on GreenXchange pools
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Unwrapping    │  Convert back to ERC-1155
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Retirement    │  Burn to claim environmental offset
└─────────────────┘
```
