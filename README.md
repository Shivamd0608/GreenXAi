# 🌿 GreenAiDEX

**GreenAiDEX** is an on-chain platform for **registering, tokenizing, and trading real-world environmental credits** in a transparent, secure, and accessible way.

The platform supports **four types of environmental credits**:
- 🌱 Green Credits  
- 💧 Water Conservation Credits  
- 🌍 Carbon Credits  
- ⚡ Renewable Energy Credits  

GreenAiDEX enables verified environmental projects to convert these credits into **ERC-1155 crypto assets**, trade them directly using **stablecoin settlement**, and optionally make them **DeFi-compatible** by wrapping them into **ERC-20 tokens tradable via a Uniswap V2–style AMM**.

GreenAiDEX is designed to make **green credit markets more efficient, accessible, and trustable** for both small sustainability projects and large organizations.

---

## 🌍 Problem Statement

Traditional green credit markets face major structural limitations:

- Centralized registries with low transparency  
- Manual verification and settlement  
- High entry barriers for small companies  
- Poor liquidity and inefficient price discovery  
- Limited global accessibility  

As a result, green credits remain **illiquid, opaque, and difficult to trade**, reducing their real-world environmental impact.

---

## ✅ GreenAiDEX Solution

GreenAiDEX moves the **entire green credit lifecycle on-chain**, removing intermediaries and enabling open participation.

### Core Benefits

- **Transparency** – Credit issuance, supply, and retirement are publicly verifiable  
- **Accessibility** – Anyone can buy or sell credits on-chain  
- **Liquidity** – Credits can be traded instantly or via DeFi pools  
- **Trust** – Smart contracts enforce rules instead of centralized entities  
- **Low Cost** – Built on Mantle L2 for fast, low-fee transactions  

---

## 🔄 End-to-End Credit Lifecycle

Real-World Environmental Credit  
↓  
On-chain Registration  
↓  
ERC-1155 Credit Token  
↓  
Buy / Sell via Orderbook  
↓  
(Optional) ERC-20 Wrapping  
↓  
AMM Trading (Uniswap-style)  
↓  
Retirement (On-chain Burn)

Each credit has **full on-chain traceability** from issuance to retirement.

---

## 🏗 System Architecture

┌──────────────────────────────────────────┐
│ Frontend                                │
│ Next.js + Ethers.js + TailwindCSS       │
│ - Credit Registry UI                   │
│ - Buy / Sell Credits                   │
│ - Wrap / Unwrap Tokens                 │
│ - Liquidity & Swap Interface           │
│ - AI Chat Assistant                   │
└───────────────────────┬──────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────┐
│ AI Backend                              │
│ - User guidance logic                  │
│ - Confidence score calculation         │
│ - Read-only blockchain access          │
└───────────────────────┬──────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────┐
│ Mantle Sepolia (L2)                    │
│                                        │
│ ┌──────── ERC-1155 Credits ─────────┐ │
│ │ GreenCreditToken                  │ │
│ └──────────────┬────────────────────┘ │
│                ▼                      │
│ ┌──────── ERC-20 Wrappers ───────────┐ │
│ │ Wrapper Factory + Wrappers         │ │
│ └──────────────┬─────────────────────┘ │
│                ▼                      │
│ ┌────────── AMM (Uniswap V2) ─────────┐│
│ │ Factory • Pair • Router             ││
│ └──────────────┬──────────────────────┘│
│                ▼                       │
│ ┌────────── Orderbook ────────────────┐│
│ │ Stablecoin-settled credit trades    ││
│ └─────────────────────────────────────┘│
└──────────────────────────────────────────┘

## 🧩 Full System Workflow

![GreenAiDEX Workflow](./<your-image-name>.png)


## 🔁 AMM vs Orderbook in GreenXchange

GreenAiDEX uses **both an Orderbook and an AMM** to support different trading needs.

### 📊 Comparison Table

| Feature | Orderbook (ERC-1155) | AMM (ERC-20 Wrapped) |
|------|----------------------|----------------------|
| Token type | Direct ERC-1155 credits | ERC-20 wrapped credits |
| Trading model | Fixed-price, peer-to-peer | Automated (x · y = k) |
| Liquidity requirement | No pooled liquidity | Requires liquidity providers |
| Price impact | No slippage | Slippage based on pool size |
| Execution | Match-based | Instant swap |
| Transaction size | Best for **large trades** | Best for **small trades** |

### 🧠 Why both are used

- **Orderbook**
  - Preserves native ERC-1155 credit structure  
  - Ideal for bulk and institutional trades  
  - Predictable pricing (no slippage)

- **AMM**
  - Enables DeFi composability via ERC-20  
  - Instant execution for retail users  
  - Always-on liquidity pools  

> Together, they balance **precision trading** and **liquidity-driven trading**.

---

## 🧠 AI Assistant Layer

GreenAiDEX integrates an **AI-powered assistant** to improve usability and reduce user errors.

### AI Capabilities

- In-app chat guidance
- Step-by-step help for:
  - Credit registration & minting
  - Buying / selling credits
  - Token approvals
  - ERC-1155 ↔ ERC-20 wrapping
  - Liquidity provision & swaps
- Clear explanations of failed transactions
- Risk-aware insights using on-chain data

⚠️ The AI operates in **read-only mode** and never executes transactions.

---

## 📊 Swap Confidence Score

Before executing a swap, users are shown a **Confidence Score (0–100)** calculated from:

- Liquidity depth  
- Trade size vs pool reserves  
- Expected price impact  
- User slippage tolerance  

Example:

Confidence Score: 76 / 100
Liquidity: Strong
Price Impact: Moderate
Slippage Risk: Low


This helps users **understand trade quality before execution**.

---

## 🧱 Core Protocol Components

### 1️⃣ Green Credit Registry (ERC-1155)

**Purpose**: Tokenize verified environmental credits.

- ERC-1155 multi-token standard  
- Credit registration & verification  
- Supply and retirement tracking  
- Freeze & revoke mechanisms  
- Acts as the **source of truth**

---

### 2️⃣ ERC-1155 → ERC-20 Wrapper Layer

**Purpose**: Enable DeFi compatibility.

- One wrapper per credit type  
- Fully collateralized 1:1 backing  
- Reentrancy-safe mint & burn  
- Credit status validation  

---

### 3️⃣ AMM Layer (Uniswap V2 Style)

**Purpose**: Permissionless liquidity & swaps.

- Factory • Pair • Router architecture  
- Constant product formula (`x * y = k`)  
- 0.3% LP fee  
- Slippage & deadline protection  

---

### 4️⃣ Orderbook (Stablecoin Settlement)

**Purpose**: Fixed-price trading of credits.

- On-chain escrow  
- Access-controlled actions  
- Pausable & reentrancy-safe  
- Supports direct ERC-1155 trades  

---

## 💵 Stablecoin & Faucet System

- Uses **Mock USDC (mUSDC)**  
- Faucet available on frontend  
- Enables realistic testing  
- Smooth onboarding for new users  

---

## ⚙️ Technology Stack

### Smart Contracts
- Solidity ^0.8.20  
- OpenZeppelin libraries  
- ERC-1155 & ERC-20 standards  
- Uniswap V2–style AMM  

### Frontend
- Next.js 14  
- TailwindCSS  
- Ethers.js  

### AI Layer
- LLM-based assistant  
- On-chain data interpretation  
- Confidence scoring  
- Read-only execution  

### Network
- Mantle Sepolia (L2)  
- Chain ID: 5003  

---

## 🚀 Getting Started

```bash
git clone https://github.com/Shivamd0608/GreenAiDEX.git
cd GreenAiDEX/frontend
npm install
npm run dev
```