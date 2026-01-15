// app/green-credits/page.js
'use client';
import { useState } from 'react';
import { mintApprovedToken , getBalanceOf} from "@/contexts/MintToken";

const GREEN_CREDIT_TYPES = [
  {
    id: 1,
    name: "Carbon Credits",
    icon: "🌳",
    description: "Verified removal or avoidance of CO₂ and greenhouse gases",
    benefits: ["CO₂ reduction & climate mitigation", "Supports reforestation & carbon capture", "Verified offsets for corporate reporting"],
    projects: ["Reforestation", "Soil Carbon Sequestration", "Direct Air Capture"],
    priceRange: "$18 – $40",
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
    benefits: ["Displaces fossil generation", "Supports renewable build-out", "Reduces grid carbon intensity"],
    projects: ["Solar Farms", "Onshore/Offshore Wind", "Small Hydro & Rooftop Solar"],
    priceRange: "$7 – $12",
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
    benefits: ["Improves water availability", "Protects aquatic ecosystems", "Supports sustainable agriculture"],
    projects: ["Efficient Irrigation", "Watershed Restoration", "Rainwater Harvesting"],
    priceRange: "$4 – $10",
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
    benefits: ["Reduces fossil feedstock use", "Promotes circular economy", "Creates local green jobs"],
    projects: ["Biomass-to-energy", "Bio-based materials", "Waste-to-resource"],
    priceRange: "$25 – $55",
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
  const [selectedCredit, setSelectedCredit] = useState(GREEN_CREDIT_TYPES[0]); // Default to first credit

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

  // Update tokenId when credit type changes
  const handleCreditChange = (creditId) => {
    const selected = GREEN_CREDIT_TYPES.find(credit => credit.id === creditId);
    setSelectedCredit(selected);
    // Set tokenId based on selected credit (you can adjust this mapping as needed)
    setTokenId(creditId.toString());
  };

  return (
    <div className="min-h-screen bg-gray text-white p-4">
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

      {/* Single Credit Selection Box */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-center">Select Credit Type</h2>
          
          {/* Credit Type Dropdown */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm mb-2">Choose Credit Type</label>
            <div className="relative">
              <select
                value={selectedCredit.id}
                onChange={(e) => handleCreditChange(parseInt(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white appearance-none focus:outline-none focus:border-emerald-500"
              >
                {GREEN_CREDIT_TYPES.map((credit) => (
                  <option key={credit.id} value={credit.id}>
                    {credit.icon} {credit.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Selected Credit Info */}
          <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedCredit.color} mb-6`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{selectedCredit.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCredit.name}</h3>
                <p className="text-white/80 text-sm">{selectedCredit.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-white/70 text-xs">Price Range</p>
                <p className="text-white font-bold">{selectedCredit.priceRange}</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-xs">Market Demand</p>
                <p className={`font-bold ${
                  selectedCredit.demand === 'Very High' ? 'text-emerald-200' :
                  selectedCredit.demand === 'High' ? 'text-cyan-200' : 'text-blue-200'
                }`}>
                  {selectedCredit.demand}
                </p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-xs">Total Stats</p>
                <p className="text-white font-bold">{selectedCredit.stats}</p>
              </div>
            </div>
          </div>

          {/* Mint Button */}
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
            >
              🪙 Mint {selectedCredit.name}
            </button>
          </div>
        </div>
      </div>

      {/* Mint Modal - SAME LOGIC */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-center">Mint {selectedCredit.name}</h2>

            {/* Show selected credit info */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-700/30 rounded-lg">
              <span className="text-xl">{selectedCredit.icon}</span>
              <div>
                <p className="text-gray-300 text-sm font-semibold">{selectedCredit.name}</p>
               
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Token ID </label>
                <input
                  type="number"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full bg-gray-700/30 border border-gray-500 rounded-lg p-2 text-gray-300 "
                />
                <p className="text-gray-400 text-xs mt-1">Based on selected credit type</p>
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
                onClick={() => {
                  setTokenId(selectedCredit.id.toString());
                  MintToken();
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-all font-semibold text-sm"
              >
                Mint Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
