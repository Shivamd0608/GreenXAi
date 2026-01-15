import { NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ethers } from "ethers";
import { z } from "zod";

// ============================================================
// Contract ABIs (minimal for view functions)
// ============================================================
const ORDERBOOK_ABI = [
  "function orders(uint256) view returns (address maker, uint256 tokenId, bool isBuy, uint256 price, uint256 amount, uint256 filled, uint256 expiration, uint256 minAmountOut, address referrer)",
  "function orderActive(uint256) view returns (bool)",
  "function nextOrderId() view returns (uint256)",
  "function mUSDCDecimals() view returns (uint8)",
];

const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
];

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function allPairsLength() view returns (uint256)",
  "function allPairs(uint256) view returns (address)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
];

const GREEN_CREDIT_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getCreditInfo(uint256 tokenId) view returns (tuple(uint8 creditType, string projectTitle, string location, bytes32 certificateHash, bool isRevoked))",
  "function uri(uint256 tokenId) view returns (string)",
];

const WRAPPER_FACTORY_ABI = [
  "function getWrapper(uint256 tokenId) view returns (address)",
  "function allWrappers(uint256) view returns (address)",
  "function allWrappersLength() view returns (uint256)",
];

// ============================================================
// Contract Addresses from Environment
// ============================================================
const CONTRACTS = {
  ORDERBOOK: process.env.NEXT_PUBLIC_ORDERBOOK,
  GREEN_CREDIT_TOKEN: process.env.NEXT_PUBLIC_GREEN_CREDIT_TOKEN,
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC,
  AMM_FACTORY: process.env.NEXT_PUBLIC_AMM_FACTORY,
  AMM_ROUTER: process.env.NEXT_PUBLIC_AMM_ROUTER,
  WRAPPED_FACTORY: process.env.NEXT_PUBLIC_WRAPPED_GREEN_CREDIT_FACTORY,
};

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

// ============================================================
// Helper: Get Provider
// ============================================================
function getProvider() {
  if (!RPC_URL) throw new Error("RPC_URL not configured");
  return new ethers.providers.JsonRpcProvider(RPC_URL);
}

// ============================================================
// Platform Info (Static)
// ============================================================
const PLATFORM_PAGES = {
  home: { path: "/", description: "Landing page with platform overview" },
  faucet: {
    path: "/faucet",
    description: "Get free mUSDC tokens for testing (10,000 mUSDC per request)",
  },
  wrap: {
    path: "/wrap",
    description:
      "Convert ERC-1155 Green Credits to ERC-20 wrapped tokens for AMM trading",
  },
  amm: {
    path: "/amm",
    description: "Swap tokens, add/remove liquidity using Uniswap V2 style AMM",
  },
  marketplace: {
    path: "/marketplace",
    description:
      "Direct orderbook trading - place buy/sell orders for Green Credits",
  },
  greenCredits: {
    path: "/green-credits",
    description:
      "Mint verified environmental credits (Carbon, REC, Biodiversity, Water, Plastic, Soil)",
  },
  onboarding: {
    path: "/onboarding",
    description: "Register new environmental projects for credit generation",
  },
  verification: {
    path: "/verification",
    description: "Auditor verification workflow for project validation",
  },
};

const CREDIT_TYPES = [
  { id: 1, name: "Carbon Credits", symbol: "CC", priceRange: "$15-$50" },
  {
    id: 2,
    name: "Renewable Energy Certificates",
    symbol: "REC",
    priceRange: "$2-$10",
  },
  {
    id: 3,
    name: "Biodiversity Credits",
    symbol: "BIO",
    priceRange: "$25-$100",
  },
  { id: 4, name: "Water Credits", symbol: "H2O", priceRange: "$5-$20" },
  { id: 5, name: "Plastic Credits", symbol: "PRC", priceRange: "$8-$25" },
  { id: 6, name: "Soil Carbon Credits", symbol: "SOIL", priceRange: "$20-$60" },
];

// ============================================================
// LANGCHAIN TOOLS - Blockchain Interaction
// ============================================================

// Tool 1: Get Active Orderbook Orders
const getOrderbookOrdersTool = tool(
  async ({ limit }) => {
    try {
      if (!CONTRACTS.ORDERBOOK) {
        return JSON.stringify({ error: "Orderbook contract not configured" });
      }

      const provider = getProvider();
      const orderbook = new ethers.Contract(
        CONTRACTS.ORDERBOOK,
        ORDERBOOK_ABI,
        provider
      );
      const nextId = await orderbook.nextOrderId();
      const orders = [];

      const start = Math.max(0, nextId.toNumber() - 50);
      for (let i = start; i < nextId.toNumber() && orders.length < limit; i++) {
        try {
          const active = await orderbook.orderActive(i);
          if (active) {
            const order = await orderbook.orders(i);
            orders.push({
              orderId: i,
              maker: order.maker,
              tokenId: order.tokenId.toString(),
              type: order.isBuy ? "BUY" : "SELL",
              priceUSD: ethers.utils.formatUnits(order.price, 6),
              totalAmount: order.amount.toString(),
              filled: order.filled.toString(),
              remaining: order.amount.sub(order.filled).toString(),
            });
          }
        } catch (e) {
          // Skip invalid orders
        }
      }

      return JSON.stringify({
        success: true,
        totalOrders: orders.length,
        orders,
        message:
          orders.length > 0
            ? `Found ${orders.length} active orders on the orderbook`
            : "No active orders found",
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_orderbook_orders",
    description:
      "Fetch active buy and sell orders from the GreenAiDEX orderbook. Use this to show users current market orders, prices, and available liquidity.",
    schema: z.object({
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of orders to fetch (default 10)"),
    }),
  }
);

// Tool 2: Get AMM Pool Info
const getAMMPoolsTool = tool(
  async ({}) => {
    try {
      if (!CONTRACTS.AMM_FACTORY) {
        return JSON.stringify({ error: "AMM Factory contract not configured" });
      }

      const provider = getProvider();
      const factory = new ethers.Contract(
        CONTRACTS.AMM_FACTORY,
        FACTORY_ABI,
        provider
      );
      const count = await factory.allPairsLength();
      const pools = [];

      for (let i = 0; i < Math.min(count.toNumber(), 10); i++) {
        try {
          const pairAddress = await factory.allPairs(i);
          const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);

          const [reserve0, reserve1] = await pair.getReserves();
          const token0Addr = await pair.token0();
          const token1Addr = await pair.token1();
          const totalSupply = await pair.totalSupply();

          // Get token symbols
          let symbol0 = "Token0",
            symbol1 = "Token1";
          let decimals0 = 18,
            decimals1 = 18;
          try {
            const token0 = new ethers.Contract(token0Addr, ERC20_ABI, provider);
            const token1 = new ethers.Contract(token1Addr, ERC20_ABI, provider);
            symbol0 = await token0.symbol();
            symbol1 = await token1.symbol();
            decimals0 = await token0.decimals();
            decimals1 = await token1.decimals();
          } catch (e) {}

          pools.push({
            pairAddress,
            token0: { address: token0Addr, symbol: symbol0 },
            token1: { address: token1Addr, symbol: symbol1 },
            reserve0: ethers.utils.formatUnits(reserve0, decimals0),
            reserve1: ethers.utils.formatUnits(reserve1, decimals1),
            lpTokenSupply: ethers.utils.formatUnits(totalSupply, 18),
          });
        } catch (e) {
          // Skip invalid pairs
        }
      }

      return JSON.stringify({
        success: true,
        totalPools: pools.length,
        pools,
        message:
          pools.length > 0
            ? `Found ${pools.length} liquidity pools`
            : "No liquidity pools found",
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_amm_pools",
    description:
      "Fetch all AMM liquidity pools with their reserves and token pairs. Use this to show available trading pairs and liquidity depth.",
    schema: z.object({}),
  }
);

// Tool 3: Get Token Balance
const getTokenBalanceTool = tool(
  async ({ tokenAddress, userAddress }) => {
    try {
      const provider = getProvider();
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const balance = await token.balanceOf(userAddress);
      const decimals = await token.decimals();
      const symbol = await token.symbol();
      const name = await token.name();

      return JSON.stringify({
        success: true,
        token: { address: tokenAddress, name, symbol, decimals },
        balance: ethers.utils.formatUnits(balance, decimals),
        balanceRaw: balance.toString(),
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_token_balance",
    description:
      "Get the balance of an ERC-20 token for a specific wallet address. Use this to check user's mUSDC or wrapped token balances.",
    schema: z.object({
      tokenAddress: z.string().describe("The ERC-20 token contract address"),
      userAddress: z
        .string()
        .describe("The wallet address to check balance for"),
    }),
  }
);

// Tool 4: Get Green Credit Balance (ERC-1155)
const getGreenCreditBalanceTool = tool(
  async ({ userAddress, tokenId }) => {
    try {
      if (!CONTRACTS.GREEN_CREDIT_TOKEN) {
        return JSON.stringify({
          error: "Green Credit contract not configured",
        });
      }

      const provider = getProvider();
      const contract = new ethers.Contract(
        CONTRACTS.GREEN_CREDIT_TOKEN,
        GREEN_CREDIT_ABI,
        provider
      );

      const balance = await contract.balanceOf(userAddress, tokenId);
      const creditType = CREDIT_TYPES.find((c) => c.id === tokenId);

      return JSON.stringify({
        success: true,
        tokenId,
        creditType: creditType?.name || `Credit Type ${tokenId}`,
        symbol: creditType?.symbol || `CT${tokenId}`,
        balance: balance.toString(),
        userAddress,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_green_credit_balance",
    description:
      "Get the balance of Green Credits (ERC-1155) for a specific token ID and wallet. Token IDs: 1=Carbon, 2=REC, 3=Biodiversity, 4=Water, 5=Plastic, 6=Soil",
    schema: z.object({
      userAddress: z.string().describe("The wallet address to check"),
      tokenId: z.number().describe("The credit type token ID (1-6)"),
    }),
  }
);

// Tool 5: Get Credit Info
const getCreditInfoTool = tool(
  async ({ tokenId }) => {
    try {
      if (!CONTRACTS.GREEN_CREDIT_TOKEN) {
        return JSON.stringify({
          error: "Green Credit contract not configured",
        });
      }

      const provider = getProvider();
      const contract = new ethers.Contract(
        CONTRACTS.GREEN_CREDIT_TOKEN,
        GREEN_CREDIT_ABI,
        provider
      );

      const creditInfo = await contract.getCreditInfo(tokenId);
      const creditType = CREDIT_TYPES.find((c) => c.id === tokenId);

      return JSON.stringify({
        success: true,
        tokenId,
        creditTypeName: creditType?.name || `Type ${creditInfo.creditType}`,
        projectTitle: creditInfo.projectTitle,
        location: creditInfo.location,
        isRevoked: creditInfo.isRevoked,
        priceRange: creditType?.priceRange || "Unknown",
      });
    } catch (err) {
      return JSON.stringify({
        error: err.message,
        message: "Credit info not registered for this token ID",
      });
    }
  },
  {
    name: "get_credit_info",
    description:
      "Get detailed information about a specific Green Credit type including project details and revocation status.",
    schema: z.object({
      tokenId: z.number().describe("The credit type token ID (1-6)"),
    }),
  }
);

// Tool 6: Get Wrapped Token Address
const getWrappedTokenTool = tool(
  async ({ tokenId }) => {
    try {
      if (!CONTRACTS.WRAPPED_FACTORY) {
        return JSON.stringify({
          error: "Wrapper Factory contract not configured",
        });
      }

      const provider = getProvider();
      const factory = new ethers.Contract(
        CONTRACTS.WRAPPED_FACTORY,
        WRAPPER_FACTORY_ABI,
        provider
      );

      const wrapperAddress = await factory.getWrapper(tokenId);

      if (wrapperAddress === ethers.constants.AddressZero) {
        return JSON.stringify({
          success: false,
          tokenId,
          message: `No wrapper exists for token ID ${tokenId}. User needs to create one first on /wrap page.`,
        });
      }

      // Get wrapper token details
      const wrapper = new ethers.Contract(wrapperAddress, ERC20_ABI, provider);
      const symbol = await wrapper.symbol();
      const name = await wrapper.name();
      const totalSupply = await wrapper.totalSupply();

      return JSON.stringify({
        success: true,
        tokenId,
        wrapperAddress,
        name,
        symbol,
        totalSupply: ethers.utils.formatUnits(totalSupply, 18),
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_wrapped_token",
    description:
      "Get the ERC-20 wrapper address for a Green Credit token ID. Wrapped tokens are needed for AMM trading.",
    schema: z.object({
      tokenId: z
        .number()
        .describe("The credit type token ID to get wrapper for (1-6)"),
    }),
  }
);

// Tool 7: Get mUSDC Balance
const getMUSDCBalanceTool = tool(
  async ({ userAddress }) => {
    try {
      if (!CONTRACTS.MOCK_USDC) {
        return JSON.stringify({ error: "mUSDC contract not configured" });
      }

      const provider = getProvider();
      const token = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        provider
      );

      const balance = await token.balanceOf(userAddress);

      return JSON.stringify({
        success: true,
        token: "mUSDC",
        address: CONTRACTS.MOCK_USDC,
        balance: ethers.utils.formatUnits(balance, 6),
        balanceRaw: balance.toString(),
        message: `User has ${ethers.utils.formatUnits(balance, 6)} mUSDC`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_musdc_balance",
    description:
      "Get the mUSDC (Mock USDC) balance for a wallet address. mUSDC is used for trading on the platform.",
    schema: z.object({
      userAddress: z
        .string()
        .describe("The wallet address to check mUSDC balance"),
    }),
  }
);

// Tool 8: Get Swap Quote
const getSwapQuoteTool = tool(
  async ({ tokenInAddress, tokenOutAddress, amountIn }) => {
    try {
      if (!CONTRACTS.AMM_FACTORY) {
        return JSON.stringify({ error: "AMM Factory not configured" });
      }

      const provider = getProvider();
      const factory = new ethers.Contract(
        CONTRACTS.AMM_FACTORY,
        FACTORY_ABI,
        provider
      );

      // Get pair address
      const pairAddress = await factory.getPair(
        tokenInAddress,
        tokenOutAddress
      );

      if (pairAddress === ethers.constants.AddressZero) {
        return JSON.stringify({
          success: false,
          message: "No liquidity pool exists for this token pair",
        });
      }

      // Get reserves
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      const [reserve0, reserve1] = await pair.getReserves();
      const token0 = await pair.token0();

      // Get decimals
      const tokenIn = new ethers.Contract(tokenInAddress, ERC20_ABI, provider);
      const tokenOut = new ethers.Contract(
        tokenOutAddress,
        ERC20_ABI,
        provider
      );
      const decimalsIn = await tokenIn.decimals();
      const decimalsOut = await tokenOut.decimals();
      const symbolIn = await tokenIn.symbol();
      const symbolOut = await tokenOut.symbol();

      // Calculate output using x*y=k formula
      const amountInWei = ethers.utils.parseUnits(
        amountIn.toString(),
        decimalsIn
      );
      const isToken0 = tokenInAddress.toLowerCase() === token0.toLowerCase();
      const reserveIn = isToken0 ? reserve0 : reserve1;
      const reserveOut = isToken0 ? reserve1 : reserve0;

      // AMM formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
      const amountInWithFee = amountInWei.mul(997);
      const numerator = amountInWithFee.mul(reserveOut);
      const denominator = reserveIn.mul(1000).add(amountInWithFee);
      const amountOutWei = numerator.div(denominator);

      const amountOut = ethers.utils.formatUnits(amountOutWei, decimalsOut);
      const rate = parseFloat(amountOut) / parseFloat(amountIn);
      const priceImpact =
        (parseFloat(amountIn) *
          parseFloat(
            ethers.utils.formatUnits(
              decimalsIn === 6 ? reserveIn : reserveOut,
              decimalsIn
            )
          )) /
        100;

      return JSON.stringify({
        success: true,
        tokenIn: { address: tokenInAddress, symbol: symbolIn },
        tokenOut: { address: tokenOutAddress, symbol: symbolOut },
        amountIn: amountIn.toString(),
        amountOut,
        rate: rate.toFixed(6),
        priceImpact: priceImpact.toFixed(2) + "%",
        pairAddress,
        message: `Swap ${amountIn} ${symbolIn} → ${amountOut} ${symbolOut} (Rate: 1 ${symbolIn} = ${rate.toFixed(
          4
        )} ${symbolOut})`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_swap_quote",
    description:
      "Calculate expected output for a token swap on the AMM. Shows the rate and price impact.",
    schema: z.object({
      tokenInAddress: z.string().describe("Address of token to swap from"),
      tokenOutAddress: z.string().describe("Address of token to swap to"),
      amountIn: z.string().describe("Amount of input token to swap"),
    }),
  }
);

// Tool 9: Get Platform Info
const getPlatformInfoTool = tool(
  async ({}) => {
    return JSON.stringify({
      success: true,
      platform: "GreenAiDEX",
      network: "Mantle Sepolia (Chain ID: 5003)",
      contracts: {
        orderbook: CONTRACTS.ORDERBOOK || "Not configured",
        greenCredit: CONTRACTS.GREEN_CREDIT_TOKEN || "Not configured",
        mockUsdc: CONTRACTS.MOCK_USDC || "Not configured",
        ammFactory: CONTRACTS.AMM_FACTORY || "Not configured",
        ammRouter: CONTRACTS.AMM_ROUTER || "Not configured",
        wrapperFactory: CONTRACTS.WRAPPED_FACTORY || "Not configured",
      },
      pages: PLATFORM_PAGES,
      creditTypes: CREDIT_TYPES,
      tradingOptions: [
        "Orderbook (limit orders) at /marketplace",
        "AMM Swaps at /amm",
      ],
    });
  },
  {
    name: "get_platform_info",
    description:
      "Get general platform information including available pages, contract addresses, and credit types.",
    schema: z.object({}),
  }
);

// Tool 10: Calculate Trade Confidence
const calculateConfidenceTool = tool(
  async ({ tradeType, hasPoolData, hasOrderData, amount }) => {
    let score = 40;
    const factors = [];

    if (hasPoolData) {
      score += 15;
      factors.push("Live pool data available");
    }
    if (hasOrderData) {
      score += 15;
      factors.push("Live orderbook data available");
    }
    if (amount && parseFloat(amount) > 0) {
      score += 10;
      factors.push("Specific amount provided");
    }
    if (tradeType === "swap" || tradeType === "buy" || tradeType === "sell") {
      score += 10;
      factors.push(`Clear trade type: ${tradeType}`);
    }

    score = Math.min(score, 95);

    return JSON.stringify({
      confidenceScore: score,
      factors,
      recommendation:
        score >= 70
          ? "Good confidence - proceed with caution"
          : "Low confidence - verify data before trading",
    });
  },
  {
    name: "calculate_trade_confidence",
    description:
      "Calculate a confidence score for a trade suggestion based on available data.",
    schema: z.object({
      tradeType: z
        .string()
        .describe("Type of trade: swap, buy, sell, liquidity"),
      hasPoolData: z
        .boolean()
        .describe("Whether pool data was successfully fetched"),
      hasOrderData: z
        .boolean()
        .describe("Whether orderbook data was successfully fetched"),
      amount: z.string().optional().describe("Trade amount if specified"),
    }),
  }
);

// ============================================================
// All Tools Array
// ============================================================
const tools = [
  getOrderbookOrdersTool,
  getAMMPoolsTool,
  getTokenBalanceTool,
  getGreenCreditBalanceTool,
  getCreditInfoTool,
  getWrappedTokenTool,
  getMUSDCBalanceTool,
  getSwapQuoteTool,
  getPlatformInfoTool,
  calculateConfidenceTool,
];

// ============================================================
// System Prompt
// ============================================================
const SYSTEM_PROMPT = `You are **GreenAiDEX Assistant**, an AI-powered guide for the GreenAiDEX decentralized exchange platform on Mantle Sepolia.

## Your Capabilities
You have access to blockchain tools that let you:
- Query live orderbook orders and prices
- Check AMM liquidity pools and reserves
- Get token balances (mUSDC, wrapped tokens, Green Credits)
- Calculate swap quotes with price impact
- Look up wrapper contract addresses
- Provide platform navigation guidance

## Platform Overview
GreenAiDEX enables trading of tokenized environmental credits:
1. **Orderbook** (/marketplace) - Limit buy/sell orders
2. **AMM** (/amm) - Uniswap V2 style token swaps
3. **Wrapping** (/wrap) - Convert ERC-1155 to ERC-20

## Credit Types (Token IDs 1-6)
1. Carbon Credits (CC) - $15-$50
2. Renewable Energy Certificates (REC) - $2-$10
3. Biodiversity Credits (BIO) - $25-$100
4. Water Credits (H2O) - $5-$20
5. Plastic Credits (PRC) - $8-$25
6. Soil Carbon Credits (SOIL) - $20-$60

## Key Addresses
- mUSDC: ${CONTRACTS.MOCK_USDC || "Not configured"}
- Orderbook: ${CONTRACTS.ORDERBOOK || "Not configured"}
- AMM Factory: ${CONTRACTS.AMM_FACTORY || "Not configured"}

## Response Guidelines
1. **USE YOUR TOOLS** to fetch real blockchain data before answering
2. Guide users to the correct page for their action
3. Provide step-by-step instructions
4. Include confidence scores for trade suggestions
5. Warn about risks: slippage, gas fees, approvals needed
6. Never give 100% confidence
7. Use markdown formatting

## Common Workflows
- **Buy Credits**: /faucet → /marketplace → place BUY order
- **Sell Credits**: /green-credits → /marketplace → SELL order  
- **AMM Trade**: /faucet → /wrap → /amm → swap

Always call relevant tools to get live data before making recommendations!`;

// ============================================================
// Create Agent
// ============================================================
function createAgent() {
  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const model = new ChatGroq({
    model: modelName,
    temperature: 0.3,
    apiKey: process.env.GROQ_API_KEY,
  });

  const agent = createReactAgent({
    llm: model,
    tools,
  });

  return agent;
}

// ============================================================
// Main API Handler
// ============================================================
export async function POST(req) {
  try {
    const body = await req.json();
    const userMessages = body.messages || [
      { role: "user", content: body.input || "Hello" },
    ];
    const userAddress = body.userAddress || null;

    // Build conversation for agent
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...userMessages.map((m) =>
        m.role === "user"
          ? new HumanMessage(
              m.content + (userAddress ? `\n[User wallet: ${userAddress}]` : "")
            )
          : new AIMessage(m.content)
      ),
    ];

    // Create and invoke agent
    const agent = createAgent();
    const result = await agent.invoke({ messages });

    // Extract final response
    let text = "";
    if (result.messages && result.messages.length > 0) {
      // Get the last AI message
      for (let i = result.messages.length - 1; i >= 0; i--) {
        const msg = result.messages[i];
        if (msg._getType && msg._getType() === "ai" && msg.content) {
          text = msg.content;
          break;
        } else if (msg.content && typeof msg.content === "string") {
          text = msg.content;
          break;
        }
      }
    }

    if (!text) {
      text =
        "I'm here to help! Ask me about trading green credits, checking balances, or navigating the platform.";
    }

    // Count tool calls for metadata
    const toolCalls =
      result.messages?.filter((m) => m._getType && m._getType() === "tool")
        ?.length || 0;

    return NextResponse.json({
      text,
      hasRealData: toolCalls > 0,
      toolsUsed: toolCalls,
      confidence: toolCalls > 0 ? 70 + Math.min(toolCalls * 5, 25) : 50,
    });
  } catch (err) {
    console.error("AI API Error:", err);
    return NextResponse.json(
      {
        error: `Error: ${String(err?.message || err)}`,
        text: `❌ **Error:** ${err.message}\n\nPlease try again or check your connection.`,
      },
      { status: 500 }
    );
  }
}
