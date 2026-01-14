import { NextResponse } from "next/server";
import { createAgent, tool } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { ethers } from "ethers";

// Enhanced contract call tool with better error handling
const callContractView = tool(
  async (input) => {
    try {
      const { address, abi, method, args = [] } = input;
      const rpc = process.env.NEXT_PUBLIC_RPC_URL || null;
      
      if (!rpc) {
        return "⚠️ No RPC_URL configured on server to query chain";
      }
      
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const contract = new ethers.Contract(address, abi, provider);
      const result = await contract[method](...args);
      
      try {
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return String(result);
      }
    } catch (err) {
      return `❌ Contract call failed: ${err.message}`;
    }
  },
  {
    name: "call_contract_view",
    description: "Call a read-only contract method. Input: { address, abi, method, args }",
  }
);

const getTokenPrice = tool(
  async (input) => {
    const { oracleAddress, oracleAbi, token } = input || {};
    
    // if (oracleAddress && oracleAbi) {
    //   const res = await callContractView({
    //     address: oracleAddress,
    //     abi: oracleAbi,
    //     method: "getPrice",
    //     args: [token],
    //   });
    //   return `**Oracle Price Result:**\n${res}`;
    // }
    
    const price = (Math.random() * 10).toFixed(2);
    return `**${token} Price:** $${price}\n\n_Note: This is placeholder data_`;
  },
  {
    name: "get_token_price",
    description: "Return price for a token. Optionally call an on-chain oracle if oracleAddress and oracleAbi are provided.",
  }
);

const getPoolInfo = tool(
  async (input) => {
    const { pairAddress, abi } = input || {};
    
    // if (pairAddress && abi) {
    //   const res = await callContractView({
    //     address: pairAddress,
    //     abi,
    //     method: "getReserves",
    //     args: [],
    //   });
    //   return `**Pool Reserves:**\n\`\`\`\n${res}\n\`\`\``;
    // }
    
    const liquidity = (Math.random() * 1_000_000).toFixed(0);
    return `**Pool Info** (${input?.pair || "unknown"}):\n\n- **Liquidity:** $${liquidity}\n- **Fee:** 0.3%\n\n_Note: Placeholder data_`;
  },
  {
    name: "get_pool_info",
    description: "Get liquidity and reserve info for a pool. If pairAddress and abi supplied, calls the contract. send a json object in tool pair: (eg: GCT/USDC)",
  }
);

const suggestTrade = tool(
  async (input) => {
    return `**Trade Suggestion:**\n\n- **Swap:** ${input.amount} ${input.from} → ${input.to}\n- **Strategy:** Use limit price near best quote\n- **Route:** Consider routing through GCT/USDC pool for better rates\n\n⚠️ _Always verify slippage and check current prices before executing_`;
  },
  {
    name: "suggest_trade",
    description: "Return a formatted trade suggestion between two tokens",
  }
);

const confidenceScore = tool(
  (input) => {
    const { calledTools = [], results = {} } = input || {};
    let score = 0.5;
    
    if (
      calledTools.includes("call_contract_view") ||
      calledTools.includes("get_pool_info") ||
      calledTools.includes("get_token_price")
    ) {
      score += 0.2;
    }
    
    try {
      const hasNumeric = Object.values(results).some((v) =>
        /\d/.test(String(v))
      );
      if (hasNumeric) score += 0.2;
    } catch (e) {
      // Ignore errors
    }
    
    if (score > 0.99) score = 0.99;
    
    return {
      score: Number(score.toFixed(2)),
      reasoning: `**Tools Used:** ${calledTools.join(", ") || "none"}\n**Results:** ${Object.keys(results).join(", ") || "none"}`,
    };
  },
  {
    name: "confidence_score",
    description: "Return a confidence score (0-1) and reasoning based on tools used and results.",
  }
);

function createAgentInstance() {
  const modelName = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const model = new ChatGroq({ model: modelName, temperature: 0.1 });

  const agent = createAgent({
    model,
    tools: [
      callContractView,
      getTokenPrice,
      getPoolInfo,
      suggestTrade,
      confidenceScore,
    ],
    systemPrompt: `You are a helpful DEX assistant that guides users on trading and safety.

**Formatting Guidelines:**
- Use **bold** for important terms and values
- Use bullet points for lists
- Use code blocks for addresses and technical data
- Be clear and concise
- Always prioritize user safety

Format your responses using markdown for better readability. End each reply with a helpful closing statement.
Give confidence score according to the data you have got , out of 100%, never give 100% confidence score
`,
  });

  return agent;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = body.messages || [
      { role: "user", content: body.input || "Hello" },
    ];

    const agent = createAgentInstance();
    const res = await agent.invoke({ messages });

    // Extract model text
    let text = "";
    if (res?.messages) {
      const modelMessages = res.messages.filter((m) => m.name === "model");
      if (modelMessages.length) {
        text = modelMessages.map((m) => m.content).join("\n\n");
      }
    }

    // Fallback if no text extracted
    if (!text) {
      text = "I'm here to help! Ask me about trading, prices, pools, or safety checks.";
    }

    return NextResponse.json({ result: res, text });
  } catch (err) {
    console.error("AI API Error:", err);
    return NextResponse.json(
      { error: `Error: ${String(err?.message || err)}` },
      { status: 500 }
    );
  }
}
