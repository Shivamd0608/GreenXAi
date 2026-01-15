"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  ArrowRight,
  Plus,
} from "lucide-react";

import {
  approveGreenCredit,
  approveMUSDC,
  placeOrder,
  fillOrder,
  getOrder,
  isOrderActive,
  getGreenCreditBalance,
} from "../../contexts/Orderbook";

import orderbookAbi from "../../../../ABI/GreenXchangeOrderbookAbi";
const ORDERBOOK_ADDRESS = process.env.NEXT_PUBLIC_ORDERBOOK;

// Debug: log the orderbook address being used
if (typeof window !== "undefined") {
  console.log("📋 Marketplace using ORDERBOOK_ADDRESS:", ORDERBOOK_ADDRESS);
  if (!ORDERBOOK_ADDRESS) {
    console.error(
      "⚠️ NEXT_PUBLIC_ORDERBOOK is undefined! Check your .env file."
    );
  }
}

async function getReadOnlyContract() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(ORDERBOOK_ADDRESS, orderbookAbi, provider);
}

// Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950"></div>
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
  </div>
);

// Notification Component
const Notification = ({ type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
  };

  const bgColors = {
    success: "bg-emerald-500/10 border-emerald-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
    error: "bg-red-500/10 border-red-500/30",
  };

  return (
    <div
      className={`${bgColors[type]} border rounded-xl p-4 flex items-start gap-3 shadow-lg backdrop-blur-sm animate-slideIn`}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-gray-100">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Order Card Component - Cleaner Design
const OrderCard = ({ order, type, onFill, loading }) => {
  const isBuy = type === "buy";
  const [fillAmount, setFillAmount] = useState("1");

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-900/70 transition-all duration-200 hover:border-slate-600/50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              isBuy
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {isBuy ? "BUY" : "SELL"}
          </span>
          <span className="text-xs text-slate-400">#{order.id}</span>
        </div>
        <span className="text-xs text-slate-500">
          Token #{order.order.tokenId?.toString() || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">Price</div>
          <div className="text-sm font-semibold text-white">
            ${ethers.utils.formatUnits(order.order.price, 6)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Available</div>
          <div className="text-sm font-semibold text-white">
            {order.order.amount.sub(order.order.filled).toString()} units
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={fillAmount}
          onChange={(e) => setFillAmount(e.target.value)}
          placeholder="Amount"
          className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
        />
        <button
          onClick={() => onFill(order.id, Number(fillAmount))}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isBuy
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isBuy ? "Sell" : "Buy"}
        </button>
      </div>
    </div>
  );
};

export default function MarketplaceClient() {
  const [tokenId, setTokenId] = useState(0);
  const [priceInput, setPriceInput] = useState("1");
  const [amountInput, setAmountInput] = useState("1");
  const [mUSDCDecimals] = useState(6);
  const [activeBuyOrders, setActiveBuyOrders] = useState([]);
  const [activeSellOrders, setActiveSellOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("marketplace");
  const [userBalance, setUserBalance] = useState("0");

  // Load user's balance for the selected tokenId
  const loadUserBalance = useCallback(async () => {
    try {
      const balance = await getGreenCreditBalance(tokenId);
      setUserBalance(balance.toString());
    } catch (err) {
      console.error("Error loading user balance:", err);
      setUserBalance("0");
    }
  }, [tokenId]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const parseAmount = useCallback((val) => ethers.BigNumber.from(val), []);
  const parsePrice = useCallback(
    (val) => ethers.utils.parseUnits(val, mUSDCDecimals),
    [mUSDCDecimals]
  );

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
      addNotification(
        "error",
        "Error loading active orders: " + (err?.message || err)
      );
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const loadCompletedOrders = useCallback(async () => {
    try {
      setLoading(true);
      const contract = await getReadOnlyContract();
      const nextIdBN = await contract.nextOrderId();
      const nextId = nextIdBN.toNumber();

      const completed = [];
      const start = Math.max(1, nextId - 500);

      const orderPromises = [];
      for (let id = start; id < nextId; ++id) {
        orderPromises.push(
          (async () => {
            try {
              const active = await isOrderActive(id);
              if (!active) {
                const order = await getOrder(id);
                return { id, order };
              }
              return null;
            } catch (err) {
              console.error(`Error fetching completed order ${id}:`, err);
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(orderPromises);
      results.forEach((result) => {
        if (result) completed.push(result);
      });

      completed.sort((a, b) => b.id - a.id);
      setCompletedOrders(completed);
    } catch (err) {
      console.error("Error loading completed orders:", err);
      addNotification(
        "error",
        "Error loading completed orders: " + (err?.message || err)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlaceSellOrder = async () => {
    try {
      setLoading(true);

      addNotification("info", "Requesting ERC1155 approval...");
      await approveGreenCredit();

      const price = parsePrice(priceInput);
      const amount = parseAmount(amountInput);

      addNotification("info", "Placing sell order...");
      const receipt = await placeOrder(
        tokenId,
        false,
        price,
        amount,
        0,
        0,
        ethers.constants.AddressZero
      );

      addNotification("success", "Sell order placed successfully!");

      await loadActiveOrders();
    } catch (err) {
      console.error("Error placing sell order:", err);
      addNotification(
        "error",
        "Error placing sell order: " + (err?.message || err)
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBuyOrder = async () => {
    try {
      setLoading(true);
      const price = parsePrice(priceInput);
      const amount = parseAmount(amountInput);
      const total = price.mul(amount);

      addNotification("info", "Requesting mUSDC approval...");
      await approveMUSDC(total);

      addNotification("info", "Placing buy order...");
      const receipt = await placeOrder(
        tokenId,
        true,
        price,
        amount,
        0,
        0,
        ethers.constants.AddressZero
      );

      addNotification("success", "Buy order placed successfully!");

      await loadActiveOrders();
    } catch (err) {
      console.error("Error placing buy order:", err);
      addNotification(
        "error",
        "Error placing buy order: " + (err?.message || err)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillOrder = async (orderId, fillAmountRaw) => {
    try {
      setLoading(true);
      const order = await getOrder(orderId);
      const isBuy = order.isBuy;
      const price = ethers.BigNumber.from(order.price.toString());
      const fillAmount = ethers.BigNumber.from(fillAmountRaw.toString());

      if (!isBuy) {
        const tradeValue = price.mul(fillAmount);
        addNotification("info", "Approving mUSDC for purchase...");
        await approveMUSDC(tradeValue);
      } else {
        addNotification("info", "Approving credits for sale...");
        await approveGreenCredit();
      }

      addNotification("info", "Filling order...");
      const receipt = await fillOrder(orderId, fillAmount);

      addNotification("success", "Order filled successfully!");

      await Promise.all([loadActiveOrders(), loadCompletedOrders()]);
    } catch (err) {
      console.error("Error filling order:", err);
      addNotification("error", "Error filling order: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
        } catch (e) {
          console.log("Wallet connection skipped");
        }
      }
    })();
  }, []);

  useEffect(() => {
    loadActiveOrders();
    loadCompletedOrders();
    loadUserBalance();
  }, [tokenId, loadActiveOrders, loadCompletedOrders, loadUserBalance]);

  return (
    <div className="min-h-screen bg-black text-gray-100 relative">
      <AnimatedBackground />

      {/* Notifications Container */}
      <div className="fixed top-6 right-6 z-50 space-y-2 w-full max-w-md">
        {notifications.map((notif) => (
          <Notification
            key={notif.id}
            type={notif.type}
            message={notif.message}
            onClose={() =>
              setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
            }
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">GreenAiDEX</h1>
                <p className="text-slate-400 text-sm">
                  Trade Green Credits with mUSDC
                </p>
              </div>
            </div>
            <button
              onClick={loadActiveOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "marketplace"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Order History
            </button>
          </div>
        </div>

        {activeTab === "marketplace" && (
          <div className="space-y-6">
            {/* Create Order Section */}
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">
                  Create New Order
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Token ID
                  </label>
                  <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                  <div className="mt-1 text-xs text-emerald-400">
                    Your balance: {userBalance} credits
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price (mUSDC)
                  </label>
                  <input
                    type="text"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handlePlaceSellOrder}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
                  >
                    {loading ? "..." : "Sell"}
                  </button>
                  <button
                    onClick={handlePlaceBuyOrder}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
                  >
                    {loading ? "..." : "Buy"}
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  All transactions are settled in mUSDC stablecoin
                </p>
              </div>
            </div>

            {/* Active Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sell Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    Sell Orders
                    <span className="text-xs bg-red-500/20 text-red-300 rounded-full px-2 py-1">
                      {activeSellOrders.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {loading && activeSellOrders.length === 0 ? (
                    <div className="text-slate-500 text-center py-12 bg-slate-900/30 rounded-lg border border-slate-700/50">
                      Loading orders...
                    </div>
                  ) : activeSellOrders.length === 0 ? (
                    <div className="text-slate-500 text-center py-12 bg-slate-900/30 rounded-lg border border-slate-700/50">
                      No sell orders available
                    </div>
                  ) : (
                    activeSellOrders.map((s) => (
                      <OrderCard
                        key={s.id}
                        order={s}
                        type="sell"
                        onFill={handleFillOrder}
                        loading={loading}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Buy Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                    Buy Orders
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 rounded-full px-2 py-1">
                      {activeBuyOrders.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {loading && activeBuyOrders.length === 0 ? (
                    <div className="text-slate-500 text-center py-12 bg-slate-900/30 rounded-lg border border-slate-700/50">
                      Loading orders...
                    </div>
                  ) : activeBuyOrders.length === 0 ? (
                    <div className="text-slate-500 text-center py-12 bg-slate-900/30 rounded-lg border border-slate-700/50">
                      No buy orders available
                    </div>
                  ) : (
                    activeBuyOrders.map((b) => (
                      <OrderCard
                        key={b.id}
                        order={b}
                        type="buy"
                        onFill={handleFillOrder}
                        loading={loading}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                Completed Orders
                <span className="text-xs bg-cyan-500/20 text-cyan-300 rounded-full px-2 py-1">
                  {completedOrders.length}
                </span>
              </h3>
              <button
                onClick={loadCompletedOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
              {completedOrders.length === 0 ? (
                <div className="text-slate-500 text-center py-16 bg-slate-900/30 rounded-lg border border-slate-700/50">
                  No completed orders yet
                </div>
              ) : (
                completedOrders.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-900/70 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-cyan-400 font-semibold">
                          #{c.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            c.order.isBuy
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {c.order.isBuy ? "BUY" : "SELL"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Token #{c.order.tokenId?.toString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">
                        ${ethers.utils.formatUnits(c.order.price, 6)} mUSDC
                      </span>
                      <span className="text-slate-400">
                        {c.order.filled.toString()}/{c.order.amount.toString()}{" "}
                        units
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
}
