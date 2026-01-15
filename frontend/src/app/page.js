"use client";
import { useState } from "react";
import Link from "next/link";
import { useWeb3 } from "../contexts/Web3Context";

export default function Home() {
  const { account, isConnected, connectWallet } = useWeb3();
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [modalStep, setModalStep] = useState("main"); // 'main', 'buy', 'sell-existing'

  const coreFeatures = [
    {
      emoji: "🪙",
      title: "Tokenize Environmental Credits",
      description:
        "Convert verified environmental projects into ERC-1155 tokens on Mantle L2",
      link: "/onboarding",
      linkText: "Register Project",
    },
    {
      emoji: "🔄",
      title: "Wrap ERC-1155 to ERC-20",
      description:
        "Make your credits DeFi compatible by wrapping them for use in liquidity pools",
      link: "/green-credits",
      linkText: "Explore Credits",
    },
    {
      emoji: "🤖",
      title: "AMM Trading",
      description:
        "Instant swaps with Uniswap V2 style pools. Earn 0.3% fees as liquidity provider",
      link: "/trade/amm",
      linkText: "Trade on AMM",
    },
    {
      emoji: "📊",
      title: "Orderbook Trading",
      description:
        "Place limit orders with USDC settlement. Platform fee: 0.25%",
      link: "/marketplace",
      linkText: "View Orderbook",
    },
  ];

  const creditTypes = [
    {
      emoji: "⚫",
      title: "Carbon Credits",
      description: "CO2 offset and sequestration projects",
      color: "bg-gray-800/50",
    },
    {
      emoji: "💧",
      title: "Water Credits",
      description: "Water conservation and restoration projects",
      color: "bg-blue-800/50",
    },
    {
      emoji: "⚡",
      title: "Renewable Energy",
      description: "Clean energy production credits",
      color: "bg-yellow-800/50",
    },
    {
      emoji: "🌱",
      title: "Green Credits",
      description: "General environmental improvement projects",
      color: "bg-green-800/50",
    },
  ];

  const mantleBenefits = [
    {
      title: "99.9% Lower Fees",
      description:
        "Mantle L2 reduces transaction costs from $50-200 to $0.01-0.10 per trade",
      icon: "💰",
    },
    {
      title: "Instant Settlement",
      description:
        "~1 second transaction finality with Ethereum-level security",
      icon: "⚡",
    },
    {
      title: "Global Accessibility",
      description:
        "Low fees enable participation from developing countries and small projects",
      icon: "🌍",
    },
    {
      title: "Full DeFi Compatibility",
      description:
        "EVM compatible with seamless integration to other DeFi protocols",
      icon: "🔗",
    },
  ];

  // Handle Start Trading button click
  const handleStartTrading = () => {
    if (!isConnected) {
      connectWallet();
    } else {
      setModalStep("main");
      setShowTradingModal(true);
    }
  };

  // Trading Modal Component
  const TradingModal = () => {
    if (!showTradingModal) return null;

    const handleBack = () => {
      setModalStep("main");
    };

    const handleBuyOption = (option) => {
      setShowTradingModal(false);
      if (option === "amm") {
        window.location.href = "/amm";
      } else if (option === "orderbook") {
        window.location.href = "/marketplace?tab=buy";
      }
    };

    const handleSellOption = (option) => {
      if (option === "register") {
        setShowTradingModal(false);
        window.location.href = "/onboarding";
      } else if (option === "existing") {
        setModalStep("sell-existing");
      }
    };

    const handleSellMethod = (method) => {
      setShowTradingModal(false);
      if (method === "amm") {
        window.location.href = "/amm";
      } else if (method === "orderbook") {
        window.location.href = "/marketplace?tab=sell";
      }
    };

    // Sell Existing Options Modal
    if (modalStep === "sell-existing") {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBack}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    ←
                  </button>
                  <h3 className="text-xl font-bold text-white">
                    Sell Existing Tokens
                  </h3>
                </div>
                <button
                  onClick={() => setShowTradingModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleSellMethod("amm")}
                  className="w-full text-left border border-gray-700 rounded-xl p-6 cursor-pointer hover:bg-gray-800/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white group-hover:text-emerald-300">
                        AMM Swap
                      </h4>
                      <p className="text-gray-400 mt-2 text-sm">
                        Instant sell at current market price
                      </p>
                      <div className="mt-3 text-sm text-emerald-400">
                        ✅ Best for quick sales • Lower fees
                      </div>
                    </div>
                    <div className="text-2xl">🔄</div>
                  </div>
                </button>

                <button
                  onClick={() => handleSellMethod("orderbook")}
                  className="w-full text-left border border-gray-700 rounded-xl p-6 cursor-pointer hover:bg-gray-800/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white group-hover:text-blue-300">
                        Orderbook Trading
                      </h4>
                      <p className="text-gray-400 mt-2 text-sm">
                        Set your own price with limit orders
                      </p>
                      <div className="mt-3 text-sm text-blue-400">
                        📊 Price control • Better for large orders
                      </div>
                    </div>
                    <div className="text-2xl">📈</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-gray-300 mb-2 text-sm">
                  Quick Tip
                </h4>
                <p className="text-sm text-gray-400">
                  Use AMM for quick sales at market price. Use Orderbook to set
                  your own price.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main Trading Modal
    if (modalStep === "main") {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Start Trading Green Credits
                </h3>
                <button
                  onClick={() => setShowTradingModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Buy Section */}
                <div>
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-emerald-400 mb-2">
                      Buy Credits
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Purchase verified environmental credits
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleBuyOption("amm")}
                      className="w-full text-left border border-emerald-500/30 rounded-xl p-5 cursor-pointer hover:bg-emerald-500/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-white group-hover:text-emerald-300">
                            AMM Trading
                          </h5>
                          <p className="text-gray-400 mt-1 text-xs">
                            Instant swaps at market price
                          </p>
                          <div className="mt-2 text-xs text-emerald-400">
                            ✅ Best for quick purchases • Lower fees
                          </div>
                        </div>
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          🤖
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleBuyOption("orderbook")}
                      className="w-full text-left border border-blue-500/30 rounded-xl p-5 cursor-pointer hover:bg-blue-500/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-white group-hover:text-blue-300">
                            Orderbook Trading
                          </h5>
                          <p className="text-gray-400 mt-1 text-xs">
                            Place limit orders at specific prices
                          </p>
                          <div className="mt-2 text-xs text-blue-400">
                            📊 Best for large orders • Price control
                          </div>
                        </div>
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          📈
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sell Section */}
                <div>
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">
                      Sell Credits
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Sell your environmental credits
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleSellOption("register")}
                      className="w-full text-left border border-purple-500/30 rounded-xl p-5 cursor-pointer hover:bg-purple-500/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-white group-hover:text-purple-300">
                            Register & Mint New
                          </h5>
                          <p className="text-gray-400 mt-1 text-xs">
                            For new environmental projects
                          </p>
                          <div className="mt-2 text-xs text-purple-400">
                            🏭 Full verification process • New credits
                          </div>
                        </div>
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          🆕
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSellOption("existing")}
                      className="w-full text-left border border-orange-500/30 rounded-xl p-5 cursor-pointer hover:bg-orange-500/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-white group-hover:text-orange-300">
                            Sell Existing Tokens
                          </h5>
                          <p className="text-gray-400 mt-1 text-xs">
                            If you already have tokenized credits
                          </p>
                          <div className="mt-2 text-xs text-orange-400">
                            📦 Instant listing • No verification needed
                          </div>
                        </div>
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          📦
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1">
                      Buying Tips
                    </h5>
                    <p className="text-gray-400 text-xs">
                      Use AMM for quick purchases, Orderbook for large orders
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-red-400 mb-1">
                      Selling Tips
                    </h5>
                    <p className="text-gray-400 text-xs">
                      New projects need verification, existing tokens sell
                      instantly
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Connected as:{" "}
                  <span className="font-mono text-gray-300">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl mb-6">
              <span className="text-3xl">🌿</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Green
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                AiDEX
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Decentralized Exchange for Tokenized Environmental Credits
              <br />
              <span className="text-emerald-400">
                Built on Mantle L2 for ultra-low fees
              </span>
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={handleStartTrading}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-emerald-500/25"
              >
                {isConnected
                  ? "Start Trading"
                  : "Connect Wallet & Start Trading"}
              </button>

              <Link
                href="/onboarding"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-purple-500/25 flex items-center justify-center"
              >
                Register Project
              </Link>
            </div>

            {/* Network Status */}
            <div className="inline-flex items-center space-x-4 bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Network: Mantle Sepolia Testnet</span>
              </div>
              <div className="h-4 w-px bg-gray-600"></div>
              <span className="text-sm text-cyan-400">Chain ID: 5003</span>
              <div className="h-4 w-px bg-gray-600"></div>
              <span className="text-sm text-emerald-400">
                Gas: ~$0.01 per transaction
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mantle L2 Benefits */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <span className="text-cyan-400">Mantle L2</span>?
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              GreenAiDEX is built on Mantle Sepolia L2 for maximum efficiency
              and accessibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mantleBenefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gray-900/50 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete <span className="text-emerald-400">DeFi Ecosystem</span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              A full-fledged decentralized exchange specifically designed for
              environmental credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 group"
              >
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{feature.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 mb-6">{feature.description}</p>
                    <Link
                      href={feature.link}
                      className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <span>{feature.linkText}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Types */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Verified <span className="text-cyan-400">Credit Types</span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Trade multiple types of environmental assets with transparent
              verification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditTypes.map((credit, index) => (
              <div
                key={index}
                className={`${credit.color} rounded-xl p-6 border border-gray-700 hover:scale-105 transition-all duration-300`}
              >
                <div className="text-3xl mb-4">{credit.emoji}</div>
                <h3 className="text-lg font-bold mb-2">{credit.title}</h3>
                <p className="text-gray-400 text-sm">{credit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Options */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your{" "}
              <span className="text-emerald-400">Trading Style</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Two complementary trading systems for maximum flexibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AMM Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-2xl mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-emerald-400">
                  AMM Trading
                </h3>
                <p className="text-gray-400">
                  Constant Product Formula (x * y = k)
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Instant swaps at market price</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>0.3% trading fee to LPs</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Multi-hop swap support</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Best for quick trades</span>
                </li>
              </ul>

              <button
                onClick={() => {
                  if (isConnected) {
                    setModalStep("main");
                    setShowTradingModal(true);
                  } else {
                    connectWallet();
                  }
                }}
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Buy via AMM
              </button>
            </div>

            {/* Orderbook Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/20 rounded-2xl mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-cyan-400">
                  Orderbook Trading
                </h3>
                <p className="text-gray-400">
                  Limit orders with USDC settlement
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>Place orders at specific prices</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>0.25% platform fee</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>Partial fills supported</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>Best for large orders</span>
                </li>
              </ul>

              <Link
                href="/marketplace"
                className="block w-full bg-cyan-600 hover:bg-cyan-500 text-white text-center py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                View Orderbook
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                4
              </div>
              <div className="text-gray-400">Credit Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                2
              </div>
              <div className="text-gray-400">Trading Systems</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">
                99.9%
              </div>
              <div className="text-gray-400">Lower Fees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                1s
              </div>
              <div className="text-gray-400">Finality</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Trade{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Green Credits
            </span>
            ?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the revolution in sustainable finance. Tokenize, trade, and
            make an impact with ultra-low fees on Mantle L2.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartTrading}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              {isConnected
                ? "Start Trading Now"
                : "Connect Wallet & Start Trading"}
            </button>

            <Link
              href="/onboarding"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center"
            >
              Register Project
            </Link>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              Need test tokens? Visit{" "}
              <a
                href="https://faucet.sepolia.mantle.xyz"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Mantle Sepolia Faucet
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Trading Modal */}
      <TradingModal />
    </div>
  );
}
