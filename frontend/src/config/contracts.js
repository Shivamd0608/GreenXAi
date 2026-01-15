// ============================================================
// Contract addresses for Mantle Sepolia
// ============================================================
// IMPORTANT: Update these addresses after deployment!
// Run your deployment script and paste the addresses here.
// ============================================================

export const CONTRACTS = {
  // ─────────────────────────────────────────────────────────────
  // CORE CONTRACTS (Already deployed)
  // ─────────────────────────────────────────────────────────────
  
  // ERC-1155 Green Credit Token (existing)
  GREEN_CREDIT_TOKEN: process.env.NEXT_PUBLIC_GREEN_CREDIT_TOKEN,
  
  // Orderbook for direct trading (existing)
  ORDERBOOK: process.env.NEXT_PUBLIC_ORDERBOOK,

  // ─────────────────────────────────────────────────────────────
  // NEW CONTRACTS (Update after deployment)
  // ─────────────────────────────────────────────────────────────
  
  // MockUSDC - Faucet-enabled stablecoin for testing
  // Deploy MockUSDC.sol and paste address here
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC,
  
  // Wrapper Factory - Creates ERC-20 wrappers for ERC-1155 tokens
  // Deploy WrappedGreenCreditFactory.sol and paste address here
  WRAPPED_GREEN_CREDIT_FACTORY: process.env.NEXT_PUBLIC_WRAPPED_GREEN_CREDIT_FACTORY,
  
  // AMM Factory - Creates trading pairs (Uniswap V2 style)
  // Deploy GreenXchangeV2Factory.sol and paste address here
  AMM_FACTORY: process.env.NEXT_PUBLIC_AMM_FACTORY,
  
  // AMM Router - Handles swaps and liquidity
  // Deploy GreenXchangeV2Router.sol and paste address here
  AMM_ROUTER: process.env.NEXT_PUBLIC_AMM_ROUTER,
};

// ============================================================
// Chain configuration for Mantle Sepolia
// ============================================================

export const CHAIN_CONFIG = {
  chainId: 5003, // Mantle Sepolia
  chainIdHex: "0x138B",
  chainName: "Mantle Sepolia Testnet",
  nativeCurrency: {
    name: "MNT",
    symbol: "MNT",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"],
};

// ============================================================
// Token decimals
// ============================================================

export const DECIMALS = {
  MOCK_USDC: 6,        // MockUSDC uses 6 decimals like real USDC
  ERC20_WRAPPED: 18,   // Wrapped green credits use 18 decimals
  LP_TOKEN: 18,        // LP tokens use 18 decimals
};

export default CONTRACTS;
