"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useWeb3 } from "../contexts/Web3Context";

export default function Home() {
  const { account, isConnected, connectWallet } = useWeb3();
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [modalStep, setModalStep] = useState("main");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const coreFeatures = [
    {
      emoji: "🌿",
      title: "Tokenize Environmental Credits",
      description: "Convert verified projects into ERC-1155 tokens on Mantle L2",
      link: "/onboarding",
      linkText: "Register Project",
    },
    {
      emoji: "🔄",
      title: "Wrap for DeFi Compatibility",
      description: "Convert ERC-1155 to ERC-20 for liquidity pool integration",
      link: "/green-credits",
      linkText: "Explore Credits",
    },
    {
      emoji: "🤖",
      title: "AMM Trading",
      description: "Instant swaps with Uniswap V2 pools. Earn 0.3% LP fees",
      link: "/trade/amm",
      linkText: "Trade on AMM",
    },
    {
      emoji: "📊",
      title: "Orderbook Trading",
      description: "Limit orders with USDC settlement. 0.25% platform fee",
      link: "/marketplace",
      linkText: "View Orderbook",
    },
  ];

  const creditTypes = [
    {
      emoji: "🌳",
      title: "Carbon Credits",
      description: "CO2 offset and sequestration projects",
      stat: "1.2M+ Credits",
    },
    {
      emoji: "💧",
      title: "Water Credits",
      description: "Water conservation and restoration",
      stat: "850K+ Credits",
    },
    {
      emoji: "⚡",
      title: "Renewable Energy",
      description: "Clean energy production credits",
      stat: "2.1M+ Credits",
    },
    {
      emoji: "🌱",
      title: "Green Credits",
      description: "Environmental improvement projects",
      stat: "950K+ Credits",
    },
  ];

  const mantleBenefits = [
    {
      title: "99.9% Lower Fees",
      description: "From $50-200 to $0.01-0.10 per trade",
      icon: "💸",
      detail: "vs Ethereum Mainnet",
    },
    {
      title: "Instant Settlement",
      description: "~1 second finality with Ethereum security",
      icon: "⚡",
      detail: "Rollup Architecture",
    },
    {
      title: "Global Access",
      description: "Low fees enable developing world participation",
      icon: "🌍",
      detail: "Inclusive Finance",
    },
    {
      title: "DeFi Native",
      description: "Full EVM compatibility & protocol integration",
      icon: "🔗",
      detail: "Composability",
    },
  ];

  const handleStartTrading = () => {
    if (!isConnected) {
      connectWallet();
    } else {
      setModalStep("main");
      setShowTradingModal(true);
    }
  };

  const TradingModal = () => {
    if (!showTradingModal) return null;

    const handleBack = () => setModalStep("main");
    const handleBuyOption = (option) => {
      setShowTradingModal(false);
      option === "amm" ? (window.location.href = "/trade/amm") : (window.location.href = "/marketplace?tab=buy");
    };
    const handleSellOption = (option) => {
      option === "register" ? (window.location.href = "/onboarding") : setModalStep("sell-existing");
    };
    const handleSellMethod = (method) => {
      setShowTradingModal(false);
      method === "amm" ? (window.location.href = "/trade/amm") : (window.location.href = "/marketplace?tab=sell");
    };

    if (modalStep === "sell-existing") {
      return (
        <div className="fixed inset-0 bg-gradient-to-br from-black via-[#111111] to-black flex items-center justify-center z-50 p-4 backdrop-blur-lg">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <button onClick={handleBack} className="text-gray-400 hover:text-white p-2">←</button>
                  <h3 className="text-xl font-bold text-white">Sell Existing Tokens</h3>
                </div>
                <button onClick={() => setShowTradingModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <button onClick={() => handleSellMethod("amm")} className="w-full text-left bg-gradient-to-br from-[#222222] to-[#1A1A1A] border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <h4 className="text-lg font-semibold text-white">AMM Swap</h4>
                  <p className="text-gray-400 text-sm mt-1">Instant sell at market price</p>
                </button>
                <button onClick={() => handleSellMethod("orderbook")} className="w-full text-left bg-gradient-to-br from-[#222222] to-[#1A1A1A] border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <h4 className="text-lg font-semibold text-white">Orderbook Trading</h4>
                  <p className="text-gray-400 text-sm mt-1">Set your own price</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#111111] to-black flex items-center justify-center z-50 p-4 backdrop-blur-lg">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-gray-800 rounded-2xl max-w-4xl w-full overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">Start Trading Green Credits</h3>
              <button onClick={() => setShowTradingModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-300">Buy Credits</h4>
                <button onClick={() => handleBuyOption("amm")} className="w-full text-left bg-gradient-to-br from-[#222222] to-[#1A1A1A] border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <h5 className="font-semibold text-white">AMM Trading</h5>
                  <p className="text-gray-400 text-sm">Instant swaps</p>
                </button>
                <button onClick={() => handleBuyOption("orderbook")} className="w-full text-left bg-gradient-to-br from-[#222222] to-[#1A1A1A] border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <h5 className="font-semibold text-white">Orderbook Trading</h5>
                  <p className="text-gray-400 text-sm">Limit orders</p>
                </button>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-300">Sell Credits</h4>
                <button onClick={() => handleSellOption("register")} className="w-full text-left bg-gradient-to-br from-[#222222] to-[#1A1A1A] border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <h5 className="font-semibold text-white">Register & Mint New</h5>
                  <p className="text-gray-400 text-sm">For new projects</p>
                </button>
                <button onClick={() => handleSellOption("existing")} className="w-full text-left bg-gradient-to-br from-[#222222] to-[#1A1A1A] border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors">
                  <h5 className="font-semibold text-white">Sell Existing Tokens</h5>
                  <p className="text-gray-400 text-sm">Already have credits</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#374151] text-white overflow-hidden">
      
      {/* Dark overlay for better readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl shadow-white/5 backdrop-blur-sm">
                <span className="text-4xl">🌿</span>
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
              <span className="text-white">GREEN</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">XAiDEX</span>
            </h1>

            <p className="text-2xl md:text-3xl text-gray-300 mb-10 max-w-4xl mx-auto">
              Decentralized Exchange for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 font-semibold">
                Tokenized Environmental Assets
              </span>
              <br />
              <span className="text-lg md:text-xl text-gray-400 mt-4 block">
                Built on Mantle L2 • 99.9% Lower Fees • Instant Settlement
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
              <button
                onClick={handleStartTrading}
                className="px-10 py-5 bg-gradient-to-r from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl shadow-black/20 backdrop-blur-sm border border-white/20"
              >
                {isConnected ? "Start Trading" : "Connect Wallet & Start Trading"}
              </button>

              <Link
                href="/onboarding"
                className="px-10 py-5 bg-gradient-to-r from-[#4B5563] to-[#374151] hover:from-[#6B7280] hover:to-[#4B5563] rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl shadow-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              >
                Register Project
              </Link>
            </div>

            <div className="inline-flex items-center gap-6 bg-gradient-to-br from-white/5 to-white/2 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                <div className="text-sm text-gray-300">Mantle Sepolia</div>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="font-mono text-sm text-gray-300">Chain ID: 5003</div>
              <div className="h-8 w-px bg-white/20"></div>
              <div className="text-sm text-white">Gas: ~$0.01/tx</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mantle L2 Benefits */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Mantle L2</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Ultra-efficient infrastructure enabling accessible environmental finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mantleBenefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm">
                <div className="text-4xl mb-6">{benefit.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-white">{benefit.title}</h3>
                <p className="text-gray-400 mb-4">{benefit.description}</p>
                <div className="text-sm text-gray-500">{benefit.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="relative py-20 px-4 z-10 bg-gradient-to-b from-white/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">DeFi Ecosystem</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              End-to-end platform for environmental credit tokenization and trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <span className="text-3xl">{feature.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-gray-400 mb-8 leading-relaxed">{feature.description}</p>
                    <Link href={feature.link} className="text-white hover:text-gray-300 font-bold flex items-center gap-2">
                      {feature.linkText} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Types */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Credit Types</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Trade multiple environmental assets with transparent verification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditTypes.map((credit, index) => (
              <div key={index} className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                <div className="text-5xl mb-6">{credit.emoji}</div>
                <h3 className="text-2xl font-bold mb-3 text-white">{credit.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{credit.description}</p>
                <div className="text-lg font-bold text-white">{credit.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Options */}
      <section className="relative py-20 px-4 z-10 bg-gradient-to-b from-transparent to-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Trading Style</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Hybrid trading systems for maximum flexibility and efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AMM Card */}
            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-8 border border-white/20 backdrop-blur-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl mb-6 border border-white/20">
                  <span className="text-4xl">🤖</span>
                </div>
                <h3 className="text-3xl font-bold mb-3 text-white">AMM Trading</h3>
                <p className="text-gray-400">Constant Product Formula (x * y = k)</p>
              </div>

              <ul className="space-y-4 mb-10">
                {["Instant swaps at market price", "0.3% trading fee to LPs", "Multi-hop swap support", "Automated price discovery", "Earn fees by providing liquidity"].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mt-2"></div>
                    {item}
                  </li>
                ))}
              </ul>

              <button onClick={handleStartTrading} className="w-full bg-gradient-to-r from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] text-white py-4 rounded-xl font-bold text-lg transition-colors border border-white/20">
                Trade via AMM
              </button>
            </div>

            {/* Orderbook Card */}
            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-8 border border-white/20 backdrop-blur-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl mb-6 border border-white/20">
                  <span className="text-4xl">📊</span>
                </div>
                <h3 className="text-3xl font-bold mb-3 text-white">Orderbook Trading</h3>
                <p className="text-gray-400">Limit orders with USDC settlement</p>
              </div>

              <ul className="space-y-4 mb-10">
                {["Place orders at specific prices", "0.25% platform fee per fill", "Partial fills supported", "USDC settlement (6 decimals)", "Referrer rewards system"].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mt-2"></div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/marketplace" className="block w-full bg-gradient-to-r from-[#4B5563] to-[#374151] hover:from-[#6B7280] hover:to-[#4B5563] text-white py-4 rounded-xl font-bold text-lg text-center transition-colors border border-white/20">
                View Orderbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "4", label: "Credit Types", color: "text-white" },
              { value: "2", label: "Trading Systems", color: "text-white" },
              { value: "99.9%", label: "Lower Fees", color: "text-white" },
              { value: "1s", label: "Finality", color: "text-white" },
            ].map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-8 border border-white/10 text-center backdrop-blur-sm">
                <div className={`text-5xl font-black mb-3 ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-400 uppercase tracking-wider text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4 z-10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-8 text-white">
            Ready to Trade{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Green Credits
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Join the sustainable finance revolution. Tokenize, trade, and make an impact
            with ultra-low fees on Mantle L2 infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-8">
            <button onClick={handleStartTrading} className="px-12 py-6 bg-gradient-to-r from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] rounded-2xl font-black text-xl transition-colors border border-white/20 backdrop-blur-sm">
              {isConnected ? "Start Trading Now" : "Connect Wallet & Start Trading"}
            </button>

            <Link href="/onboarding" className="px-12 py-6 bg-gradient-to-r from-[#4B5563] to-[#374151] hover:from-[#6B7280] hover:to-[#4B5563] rounded-2xl font-black text-xl transition-colors border border-white/20 backdrop-blur-sm flex items-center justify-center">
              Register Project
            </Link>
          </div>

          <div className="inline-flex items-center gap-3 bg-gradient-to-br from-white/5 to-white/2 px-6 py-3 rounded-full border border-white/10 backdrop-blur-sm">
            <span className="text-gray-500 text-sm">Need test tokens?</span>
            <a href="https://faucet.sepolia.mantle.xyz" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 font-semibold text-sm">
              Mantle Sepolia Faucet ↗
            </a>
          </div>
        </div>
      </section>

      <TradingModal />

      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
