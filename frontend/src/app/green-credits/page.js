// app/green-credits/page.js
'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { mintApprovedToken , getBalanceOf} from "@/contexts/MintToken";

const GREEN_CREDIT_TYPES = [
  {
    id: 1,
    name: "Carbon Credits",
    icon: "🌳",
    description: "Verified removal or avoidance of CO₂ and greenhouse gases",
    priceRange: "$85-110",
    demand: "Very High",
    color: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/30",
    stats: "1M+ Tons Offset"
  },
  {
    id: 2,
    name: "Green Energy Credits",
    icon: "⚡",
    description: "Clean electricity generation from renewable sources",
    priceRange: "$70-95",
    demand: "High",
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/30",
    stats: "500K+ MWh Generated"
  },
  {
    id: 3,
    name: "Water Conservation Credits",
    icon: "💧",
    description: "Verified water savings and restoration projects",
    priceRange: "$60-85",
    demand: "Growing",
    color: "from-blue-500 to-cyan-600",
    borderColor: "border-blue-500/30",
    stats: "2M+ Liters Saved"
  },
  {
    id: 4,
    name: "Renewable Resource Credits",
    icon: "♻️",
    description: "Renewable resource projects replacing non-renewable inputs",
    priceRange: "$65-90",
    demand: "Medium",
    color: "from-purple-500 to-pink-600",
    borderColor: "border-purple-500/30",
    stats: "100K+ Tons Recycled"
  }
];

export default function GreenCreditsPage() {
  const [showModal, setShowModal] = useState(false);
  const [tokenId, setTokenId] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(null);
  const [balanceToken, setBalanceToken] = useState("");

  const inputinfo = {
    tokenId: tokenId,
    amount: amount
  };

  console.log("Mint Input Info:", inputinfo);
  localStorage.setItem('MintInfo', JSON.stringify(inputinfo));
  
  const projectInfo = JSON.parse(localStorage.getItem("MintInfo"));

  const BalanceOf = async () => {
    if (!balanceToken) {
      alert("Please enter a Token ID.");
      return;
    }
    try {
      const tx = await getBalanceOf(balanceToken);
      console.log("Fetched balance successfully ✅", tx);
      setBalance(tx.toString());
    } catch (error) {
      console.error("Error during fetching balance:", error);
      alert("Fetch Failed.");
      setBalance(null);
    }
  };

  const MintToken = async () => {
    try {
      const tx = await mintApprovedToken(projectInfo.tokenId, projectInfo.amount);
      console.log("Mint Token successful ✅", tx);
      setShowModal(false);
      setTokenId("");
      setAmount("");
    } catch (error) {
      console.error("Error during Minting:", error);
      alert("Minting Failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#374151] text-white p-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Green <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">Credits</span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Select a credit type and mint your verified tokens
        </p>
      </div>

      {/* Balance Checker */}
      <div className="max-w-md mx-auto mb-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-center">Check Token Balance</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Token ID</label>
              <input
                type="number"
                value={balanceToken}
                onChange={(e) => setBalanceToken(e.target.value)}
                placeholder="Enter Token ID"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={BalanceOf}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-all font-semibold text-sm"
            >
              Check Balance
            </button>
          </div>
          
          {balance !== null && (
            <div className="mt-4 text-center bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
              <p className="text-gray-300 text-sm">Balance:</p>
              <p className="text-2xl font-bold text-emerald-300">{balance}</p>
            </div>
          )}
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {GREEN_CREDIT_TYPES.map((card) => (
          <div
            key={card.id}
            className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-2xl overflow-hidden hover:border-gray-500 transition-colors"
          >
            {/* Card Header */}
            <div className={`w-full h-32 bg-gradient-to-r ${card.color} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-4xl">{card.icon}</div>
                <h2 className="text-xl font-bold text-white mt-1">{card.name}</h2>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 flex flex-col justify-between h-48">
              <div>
                <p className="text-gray-300 text-sm mb-3">{card.description}</p>
                
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-gray-400 text-xs">Price</p>
                    <p className="text-emerald-300 font-bold">{card.priceRange}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Demand</p>
                    <p className={`text-sm font-bold ${
                      card.demand === 'Very High' ? 'text-emerald-300' :
                      card.demand === 'High' ? 'text-cyan-300' : 'text-blue-300'
                    }`}>
                      {card.demand}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-xs border border-gray-600">
                    {card.stats}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-2 rounded-lg font-semibold transition-all"
              >
                🪙 Mint Tokens
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mint Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-center">Mint Credit Token</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Token ID</label>
                  <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Enter Token ID"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-1">Amount (max 1000)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    max="1000"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-lg transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={MintToken}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-all font-semibold text-sm"
                >
                  Mint Token
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
