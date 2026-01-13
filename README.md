# 🌿 GreenXAI

**GreenXAI** is an on-chain platform for **registering, tokenizing, and trading real-world green credits** in a transparent, secure, and accessible way.

It enables environmental projects to convert verified green credits into **ERC-1155 crypto assets**, trade them on-chain using **stablecoin settlement**, and optionally make them **DeFi-compatible** by converting them into **ERC-20 tokens tradable via a Uniswap V2–style AMM**.

GreenXAI is designed to make **green credit markets more efficient, accessible, and trustable** for both small sustainability projects and large organizations.

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

## ✅ GreenXAI Solution

GreenXAI moves the **entire green credit lifecycle on-chain**, removing intermediaries and enabling open participation.

### Core Benefits

- **Transparency** – Credit issuance, supply, and retirement are publicly verifiable  
- **Accessibility** – Anyone can buy or sell credits on-chain  
- **Liquidity** – Credits can be traded instantly or via DeFi pools  
- **Trust** – Smart contracts enforce rules instead of centralized entities  
- **Low Cost** – Built on Mantle L2 for fast, low-fee transactions  

---

## 🔄 End-to-End Credit Lifecycle

Real-World Green Credit
↓
On-chain Registration
↓
ERC-1155 Credit Token
↓
Buy / Sell On-chain
↓
(Optional) ERC-20 Wrapping
↓
AMM Trading (Uniswap-style)
↓
Retirement (On-chain Burn)


Each credit has **full on-chain traceability** from issuance to retirement.

---

## 🧠 AI Assistant Layer

GreenXAI integrates an **AI-powered assistant** to improve usability and reduce user errors.

### AI Capabilities

- In-app chat guidance
- Step-by-step explanations for:
  - Buying and selling credits
  - Token approvals
  - ERC-1155 ↔ ERC-20 conversion
  - Liquidity provision and swaps
- Clear explanations of failed transactions
- Risk-aware insights using on-chain data

The AI operates in **read-only mode** and does not execute transactions.

---

## 📊 Swap Confidence Score

Before executing a swap, users are shown a **Confidence Score (0–100)** based on real on-chain parameters:

- Liquidity depth
- Trade size relative to pool reserves
- Expected price impact
- User-defined slippage tolerance

Example:

Confidence Score: 76 / 100
Liquidity: Strong
Price Impact: Moderate
Slippage Risk: Low

yaml
￼Copy code


This helps users **understand trade quality before execution**.

---

## 🏗 System Architecture

┌──────────────────────────────────────────┐
│ Frontend │
│ Next.js + Ethers.js + TailwindCSS │
│ - Credit Registry UI │
│ - Buy / Sell Credits │
│ - Wrap / Unwrap Tokens │
│ - Liquidity & Swap Interface │
│ - AI Chat Assistant │
└───────────────────────┬──────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ AI Backend │
│ - User guidance logic │
│ - Confidence score calculation │
│ - Read-only blockchain access │
└───────────────────────┬──────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ Mantle Sepolia (L2) │
│ │
│ ┌──────── ERC-1155 Credits ─────────┐ │
│ │ GreenCreditToken │ │
│ └──────────────┬────────────────────┘ │
│ ▼ │
│ ┌──────── ERC-20 Wrappers ───────────┐ │
│ │ Wrapper Factory + Wrappers │ │
│ └──────────────┬─────────────────────┘ │
│ ▼ │
│ ┌────────── AMM (Uniswap V2) ─────────┐│
│ │ Factory • Pair • Router ││
│ └──────────────┬──────────────────────┘│
│ ▼ │
│ ┌────────── Orderbook ────────────────┐│
│ │ Stablecoin-settled credit trades ││
│ └─────────────────────────────────────┘│
└──────────────────────────────────────────┘


---

## 🧱 Core Protocol Components

### 1️⃣ Green Credit Registry (ERC-1155)

**Purpose**: Tokenize verified environmental credits on-chain.

**Key Design & Security Elements**
- ERC-1155 multi-token standard
- `Ownable` for administrative control
- Credit registration and approval system
- Supply and retirement tracking
- Freeze and revoke mechanisms
- Safe transfer validation

This contract acts as the **source of truth** for all green credits.

---

### 2️⃣ ERC-1155 → ERC-20 Wrapper Layer

**Purpose**: Enable green credits to participate in DeFi.

**Architecture**
- Factory-based wrapper deployment
- One ERC-20 wrapper per credit type
- Fully collateralized 1:1 backing

**Security & Design**
- ERC-20 standard (18 decimals)
- `ReentrancyGuard`
- `IERC1155Receiver` compliance
- Safe mint and burn logic
- Credit status validation (freeze / revoke)

---

### 3️⃣ AMM Layer (Uniswap V2 Style)

**Purpose**: Provide permissionless liquidity and swaps.

**Architecture**
- Factory: deterministic pair creation
- Pair: liquidity pools + LP tokens
- Router: single entry point for users

**Characteristics**
- Constant product formula (`x * y = k`)
- 0.3% liquidity provider fee
- Minimum liquidity lock
- Multi-hop swap support

**Safety**
- Slippage protection
- Deadline enforcement
- Reserve synchronization
- Reentrancy protection

---

### 4️⃣ Orderbook (Stablecoin Settlement)

**Purpose**: Enable direct buy/sell of credits at fixed prices.

**Architecture & Security**
- UUPS upgradeable contract
- On-chain escrow
- `AccessControl` roles
- `Pausable` emergency controls
- `ReentrancyGuard`
- Safe ERC-20 and ERC-1155 transfers

---

## 💵 Stablecoin & Faucet System

- Trades settle using **Mock USDC**
- Faucet provided on the frontend
- Enables realistic testing during development
- Low-friction onboarding for new users

---

## ⚙️ Technology Stack

### Smart Contracts
- Solidity ^0.8.20  
- OpenZeppelin (`Ownable`, `AccessControl`, `ReentrancyGuard`, `Pausable`)  
- ERC-1155 & ERC-20 standards  
- Uniswap V2–style AMM  

### Frontend
- Next.js 14 (App Router)
- TailwindCSS
- Ethers.js

### AI Layer
- LLM-based assistant
- On-chain data interpretation
- Swap confidence scoring
- Read-only execution model

### Network
- Mantle Sepolia (L2)
- Chain ID: 5003

---

## 🚀 Getting Started

```bash
git clone https://github.com/Shivamd0608/GreenXAi.git
cd GreenXAi/frontend
npm install
npm run dev

📜 License
MIT License

