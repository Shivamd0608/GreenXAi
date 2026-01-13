"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { ethers } from "ethers";
import { 
  CheckCircle, 
  Info, 
  AlertCircle, 
  X, 
  RefreshCw, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Shield,
  ShoppingCart,
  Package,
  ArrowRightLeft,
  Plus,
  Minus
} from "lucide-react";

import {
  approveGreenCredit,
  approvePYUSD,
  placeOrder,
  fillOrder,
  getOrder,
  isOrderActive,
} from "../../contexts/Orderbook";

import orderbookAbi from "../../../../ABI/GreenXchangeOrderbookAbi";
const ORDERBOOK_ADDRESS = "0x5606f038a656684746f0F8a6e5eEf058de2fe05c";

async function getReadOnlyContract() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(ORDERBOOK_ADDRESS, orderbookAbi, provider);
}

// Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
  </div>
);

// Notification Component
const Notification = ({ type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />
  };

  const bgColors = {
    success: "bg-emerald-500/10 border-emerald-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
    error: "bg-red-500/10 border-red-500/30"
  };

  return (
    <div className={`${bgColors[type]} border rounded-xl p-4 flex items-start gap-3 shadow-lg backdrop-blur-sm animate-slideIn`}>
      {icons[type]}
      <p className="flex-1 text-sm text-gray-100">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Order Card Component - Compact
const OrderCard = ({ order, type, onFill, loading }) => {
  const isBuy = type === 'buy';
  const bgColor = isBuy ? 'from-emerald-500/10 to-emerald-500/5' : 'from-red-500/10 to-red-500/5';
  const borderColor = isBuy ? 'border-emerald-500/30' : 'border-red-500/30';
  const buttonColor = isBuy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-xl p-3 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-white">#{order.id}</span>
          <span className={`text-xs px-2 py-1 rounded-lg ${isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {isBuy ? 'BUY' : 'SELL'}
          </span>
        </div>
        <span className="text-xs text-gray-400">Token #{order.order.tokenId?.toString() || 'N/A'}</span>
      </div>
      
      <div className="text-xs text-gray-400 mb-2 truncate bg-black/20 rounded p-1 px-2">
        {order.order.maker.slice(0, 8)}...{order.order.maker.slice(-6)}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-black/20 rounded p-2">
          <div className="text-gray-400 text-xs">Price</div>
          <div className="text-white font-semibold">
            {ethers.utils.formatUnits(order.order.price, 6)}
          </div>
        </div>
        <div className="bg-black/20 rounded p-2">
          <div className="text-gray-400 text-xs">Available</div>
          <div className="text-white font-semibold">
            {order.order.amount.sub(order.order.filled).toString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          placeholder="Qty"
          defaultValue="1"
          id={`fillAmount-${type}-${order.id}`}
          className="w-16 bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          onClick={() => {
            const inputEl = document.getElementById(`fillAmount-${type}-${order.id}`);
            const qty = inputEl && inputEl.value ? Number(inputEl.value) : 1;
            onFill(order.id, qty);
          }}
          disabled={loading}
          className={`flex-1 ${buttonColor} disabled:bg-gray-600 text-white font-semibold py-2 px-2 rounded-lg text-xs transition-all duration-200 disabled:cursor-not-allowed`}
        >
          {isBuy ? 'Sell' : 'Buy'}
        </button>
      </div>
    </div>
  );
};

// PYUSD Notice Banner
const PYUSDNotice = () => (
  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-3 mb-4">
    <div className="flex items-center justify-center space-x-3 text-sm">
      <DollarSign className="w-4 h-4 text-blue-400" />
      <Shield className="w-4 h-4 text-cyan-400" />
      <span className="text-white font-semibold">All transactions on this marketplace are conducted in</span>
      <span className="bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-sm">PYUSD</span>
      <span className="text-white font-semibold">stablecoin</span>
      <Shield className="w-4 h-4 text-cyan-400" />
      <DollarSign className="w-4 h-4 text-blue-400" />
    </div>
  </div>
);

// Tab Navigation Component
const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-2 mb-6">
      <button
        onClick={() => setActiveTab('buy')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
          activeTab === 'buy' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        <ShoppingCart className="w-4 h-4" />
        <span>Buy Credits</span>
      </button>
      <button
        onClick={() => setActiveTab('sell')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
          activeTab === 'sell' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        <Package className="w-4 h-4" />
        <span>Sell Credits</span>
      </button>
      <button
        onClick={() => setActiveTab('orderbook')}
        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
          activeTab === 'orderbook' 
            ? 'bg-cyan-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        <ArrowRightLeft className="w-4 h-4" />
        <span>Orderbook View</span>
      </button>
    </div>
  );
};

// Buy Interface Component
const BuyInterface = ({ 
  tokenId, setTokenId, priceInput, setPriceInput, amountInput, setAmountInput, 
  handlePlaceBuyOrder, loading 
}) => {
  const [buyMethod, setBuyMethod] = useState('orderbook'); 

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-900/30 to-black rounded-xl border border-emerald-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-emerald-400 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Buy Green Credits
            </h3>
            <p className="text-gray-400 text-sm">Purchase verified environmental credits</p>
          </div>
        </div>

        {/* Buy Method Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-300 mb-4">Choose Buy Method</h4>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setBuyMethod('orderbook')}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                buyMethod === 'orderbook' 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">📈</div>
              <h5 className="font-semibold">Orderbook</h5>
              <p className="text-xs text-gray-400 mt-1">Place limit orders</p>
            </button>
            <a
              href="/trade/amm"
              className="p-4 rounded-xl border border-cyan-700 bg-cyan-500/10 hover:border-cyan-600 transition-all duration-300 text-center"
            >
              <div className="text-2xl mb-2">🤖</div>
              <h5 className="font-semibold">AMM Swap</h5>
              <p className="text-xs text-gray-400 mt-1">Instant swaps</p>
            </a>
          </div>
        </div>

        {/* Buy Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token ID
            </label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(Number(e.target.value))}
              className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (PYUSD per credit)
            </label>
            <input
              type="text"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g., 10.50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (Credits)
            </label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g., 100"
            />
          </div>
        </div>

        {/* Total Calculation */}
        <div className="bg-black/30 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Token ID</div>
              <div className="text-white font-semibold">{tokenId}</div>
            </div>
            <div>
              <div className="text-gray-400">Price Each</div>
              <div className="text-white font-semibold">{priceInput} PYUSD</div>
            </div>
            <div>
              <div className="text-gray-400">Total Amount</div>
              <div className="text-white font-semibold">{amountInput} credits</div>
            </div>
            <div>
              <div className="text-gray-400">Total Cost</div>
              <div className="text-white font-semibold">
                {(parseFloat(priceInput || 0) * parseInt(amountInput || 0)).toFixed(2)} PYUSD
              </div>
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handlePlaceBuyOrder}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Processing Buy Order...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Place Buy Order
            </>
          )}
        </button>

        <div className="mt-4 text-sm text-gray-400">
          <p>💸 <strong>Platform Fee:</strong> 0.25% | <strong>Mantle L2 Gas:</strong> ~$0.01</p>
          <p className="mt-1">⚡ Your buy order will be listed on the orderbook</p>
        </div>
      </div>

      {/* Active Buy Orders */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-emerald-400 flex items-center">
            Active Buy Orders
          </h3>
          <div className="text-xs text-emerald-300 px-3 py-1 bg-emerald-500/20 rounded-full">
            Ready to Sell
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4">These are buy orders waiting to be filled</p>
        {/* Buy orders list will be populated by parent component */}
      </div>
    </div>
  );
};

// Sell Interface Component
const SellInterface = ({ 
  tokenId, setTokenId, priceInput, setPriceInput, amountInput, setAmountInput, 
  handlePlaceSellOrder, loading 
}) => {
  const [sellOption, setSellOption] = useState('existing');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-900/30 to-black rounded-xl border border-red-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-red-400 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Sell Green Credits
            </h3>
            <p className="text-gray-400 text-sm">Sell your environmental credits</p>
          </div>
        </div>

        {/* Sell Option Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-300 mb-4">Choose Sell Option</h4>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSellOption('existing')}
              className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                sellOption === 'existing' 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">📦</div>
              <h5 className="font-semibold">Sell Existing</h5>
              <p className="text-xs text-gray-400 mt-1">Already have credits</p>
            </button>
            <a
              href="/onboarding"
              className="p-4 rounded-xl border border-blue-700 bg-blue-500/10 hover:border-blue-600 transition-all duration-300 text-left"
            >
              <div className="text-2xl mb-2">🆕</div>
              <h5 className="font-semibold">Register New</h5>
              <p className="text-xs text-gray-400 mt-1">New project credits</p>
            </a>
          </div>
        </div>

        {/* Sell Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token ID to Sell
            </label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(Number(e.target.value))}
              className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (PYUSD per credit)
            </label>
            <input
              type="text"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="e.g., 10.50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (Credits)
            </label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="e.g., 100"
            />
          </div>
        </div>

        {/* Total Calculation */}
        <div className="bg-black/30 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Token ID</div>
              <div className="text-white font-semibold">{tokenId}</div>
            </div>
            <div>
              <div className="text-gray-400">Price Each</div>
              <div className="text-white font-semibold">{priceInput} PYUSD</div>
            </div>
            <div>
              <div className="text-gray-400">Total Amount</div>
              <div className="text-white font-semibold">{amountInput} credits</div>
            </div>
            <div>
              <div className="text-gray-400">Total Value</div>
              <div className="text-white font-semibold">
                {(parseFloat(priceInput || 0) * parseInt(amountInput || 0)).toFixed(2)} PYUSD
              </div>
            </div>
          </div>
        </div>

        {/* Sell Button */}
        <button
          onClick={handlePlaceSellOrder}
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Processing Sell Order...
            </>
          ) : (
            <>
              <Minus className="w-5 h-5 mr-2" />
              Place Sell Order
            </>
          )}
        </button>

        <div className="mt-4 text-sm text-gray-400">
          <p>💸 <strong>Platform Fee:</strong> 0.25% | <strong>Mantle L2 Gas:</strong> ~$0.01</p>
          <p className="mt-1">⚡ Your sell order will be listed immediately on the orderbook</p>
        </div>
      </div>

      {/* Active Sell Orders */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-400 flex items-center">
            Active Sell Orders
          </h3>
          <div className="text-xs text-red-300 px-3 py-1 bg-red-500/20 rounded-full">
            Ready to Buy
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4">These are sell orders waiting to be filled</p>
        {/* Sell orders list will be populated by parent component */}
      </div>
    </div>
  );
};

export default function MarketplaceClient() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'orderbook'
  const [tokenId, setTokenId] = useState(1);
  const [priceInput, setPriceInput] = useState("1");
  const [amountInput, setAmountInput] = useState("1");
  const [pyusdDecimals] = useState(6);
  const [activeBuyOrders, setActiveBuyOrders] = useState([]);
  const [activeSellOrders, setActiveSellOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Set initial tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'buy' || tab === 'sell') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const loadActiveOrders = useCallback(async () => {
    try {
      setLoading(true);
      const contract = await getReadOnlyContract();
      const nextIdBN = await contract.nextOrderId();
      const nextId = nextIdBN.toNumber();

      const buys = [];
      const sells = [];
      const start = Math.max(1, nextId - 500);

      const orderPromises = [];
      for (let id = start; id < nextId; ++id) {
        orderPromises.push(
          (async () => {
            try {
              const active = await contract.orderActive(id);
              if (!active) return null;

              const order = await contract.orders(id);
              return { id, order, isBuy: order.isBuy };
            } catch (err) {
              console.error(`Error fetching order ${id}:`, err);
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(orderPromises);
      results.forEach((result) => {
        if (result) {
          if (result.isBuy) buys.push({ id: result.id, order: result.order });
          else sells.push({ id: result.id, order: result.order });
        }
      });

      setActiveBuyOrders(buys);
      setActiveSellOrders(sells);
    } catch (err) {
      console.error("Error loading active orders:", err);
      addNotification('error', "Error loading active orders: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const handlePlaceSellOrder = async () => {
    try {
      setLoading(true);
      
      addNotification('info', "Requesting ERC1155 approval...");
      await approveGreenCredit();

      const price = ethers.utils.parseUnits(priceInput, pyusdDecimals);
      const amount = ethers.BigNumber.from(amountInput);

      addNotification('info', "Placing sell order...");
      const receipt = await placeOrder(tokenId, false, price, amount, 0, 0, ethers.constants.AddressZero);
      
      addNotification('success', "Sell order placed successfully!");
      
      await loadActiveOrders();
    } catch (err) {
      console.error("Error placing sell order:", err);
      addNotification('error', "Error placing sell order: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBuyOrder = async () => {
    try {
      setLoading(true);
      const price = ethers.utils.parseUnits(priceInput, pyusdDecimals);
      const amount = ethers.BigNumber.from(amountInput);
      const total = price.mul(amount);

      addNotification('info', "Requesting PYUSD approval...");
      await approvePYUSD(total);

      addNotification('info', "Placing buy order...");
      const receipt = await placeOrder(tokenId, true, price, amount, 0, 0, ethers.constants.AddressZero);
      
      addNotification('success', "Buy order placed successfully!");
      
      await loadActiveOrders();
    } catch (err) {
      console.error("Error placing buy order:", err);
      addNotification('error', "Error placing buy order: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveOrders();
  }, [loadActiveOrders]);

  return (
    <div className="min-h-screen bg-black text-gray-100 py-4 pt-16 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Notifications Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-11/12 max-w-md">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            type={notif.type}
            message={notif.message}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">GreenXchange Marketplace</h1>
          </div>
          <p className="text-gray-400 text-sm">Trade Green Credits on the blockchain</p>
        </div>

        {/* PYUSD Notice */}
        <PYUSDNotice />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column - Active Interface */}
          <div className="xl:col-span-8">
            {activeTab === 'buy' && (
              <BuyInterface
                tokenId={tokenId}
                setTokenId={setTokenId}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                amountInput={amountInput}
                setAmountInput={setAmountInput}
                handlePlaceBuyOrder={handlePlaceBuyOrder}
                loading={loading}
              />
            )}

            {activeTab === 'sell' && (
              <SellInterface
                tokenId={tokenId}
                setTokenId={setTokenId}
                priceInput={priceInput}
                setPriceInput={setPriceInput}
                amountInput={amountInput}
                setAmountInput={setAmountInput}
                handlePlaceSellOrder={handlePlaceSellOrder}
                loading={loading}
              />
            )}

            {activeTab === 'orderbook' && (
              <div className="space-y-6">
                {/* Place Order Card */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Place New Order
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Token ID
                      </label>
                      <input
                        type="number"
                        value={tokenId}
                        onChange={(e) => setTokenId(Number(e.target.value))}
                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price (PYUSD)
                      </label>
                      <input
                        type="text"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                    <div className="flex space-x-2 items-end">
                      <button
                        onClick={handlePlaceSellOrder}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? '...' : 'Sell'}
                      </button>
                      <button
                        onClick={handlePlaceBuyOrder}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-700 hover:from-emerald-700 hover:to-cyan-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? '...' : 'Buy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orders Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sell Orders */}
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-bold text-red-400 flex items-center">
                        Sell Orders
                        <span className="ml-2 text-xs bg-red-500/20 text-red-300 rounded-full px-2 py-1">
                          {activeSellOrders.length}
                        </span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                      {activeSellOrders.length === 0 ? (
                        <div className="text-gray-500 text-center py-4 text-xs bg-black/20 rounded border border-gray-800">
                          No sell orders
                        </div>
                      ) : (
                        activeSellOrders.slice(0, 5).map((s) => (
                          <OrderCard
                            key={s.id}
                            order={s}
                            type="sell"
                            onFill={() => {}}
                            loading={loading}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Buy Orders */}
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-bold text-emerald-400 flex items-center">
                        Buy Orders
                        <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 rounded-full px-2 py-1">
                          {activeBuyOrders.length}
                        </span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                      {activeBuyOrders.length === 0 ? (
                        <div className="text-gray-500 text-center py-4 text-xs bg-black/20 rounded border border-gray-800">
                          No buy orders
                        </div>
                      ) : (
                        activeBuyOrders.slice(0, 5).map((b) => (
                          <OrderCard
                            key={b.id}
                            order={b}
                            type="buy"
                            onFill={() => {}}
                            loading={loading}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Market Info */}
          <div className="xl:col-span-4 space-y-8">
            {/* Quick Links */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a href="/trade/amm" className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <div className="font-semibold">AMM Swap</div>
                    <div className="text-xs text-gray-400">Instant token swaps</div>
                  </div>
                </a>
                <a href="/onboarding" className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏭</span>
                  </div>
                  <div>
                    <div className="font-semibold">Register Project</div>
                    <div className="text-xs text-gray-400">Mint new credits</div>
                  </div>
                </a>
                <a href="/portfolio" className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <div className="font-semibold">My Portfolio</div>
                    <div className="text-xs text-gray-400">View your holdings</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Market Stats */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Market Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm">Total Orders</div>
                  <div className="text-2xl font-bold">
                    {activeBuyOrders.length + activeSellOrders.length}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Buy Orders</div>
                    <div className="text-xl font-bold text-emerald-400">{activeBuyOrders.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Sell Orders</div>
                    <div className="text-xl font-bold text-red-400">{activeSellOrders.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>    
    </div>
  );
}
