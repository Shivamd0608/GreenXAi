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

// Animated Background Component - Updated to match your color scheme
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#374151]"></div>
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
  </div>
);

// Notification Component - Updated colors
const Notification = ({ type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
    error: <AlertCircle className="w-5 h-5 text-white" />,
  };

  const bgColors = {
    success: "bg-gradient-to-br from-[#374151] to-[#1F2937] border border-white/20",
    info: "bg-gradient-to-br from-[#4B5563] to-[#374151] border border-white/20",
    error: "bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] border border-white/20",
  };

  return (
    <div
      className={`${bgColors[type]} rounded-xl p-4 flex items-start gap-3 shadow-2xl shadow-black/20 backdrop-blur-sm animate-slideIn`}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-white">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Order Card Component - Updated to match your color scheme
const OrderCard = ({ order, type, onFill, loading }) => {
  const isBuy = type === "buy";
  const [fillAmount, setFillAmount] = useState("1");

  return (
    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 hover:border-white/30 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
              isBuy
                ? "bg-gradient-to-br from-[#374151] to-[#1F2937] text-white border border-white/20"
                : "bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] text-white border border-white/20"
            }`}
          >
            {isBuy ? "BUY" : "SELL"}
          </span>
          <span className="text-xs text-gray-400">#{order.id}</span>
        </div>
        <span className="text-xs text-gray-500">
          Token #{order.order.tokenId?.toString() || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Price</div>
          <div className="text-sm font-semibold text-white">
            ${ethers.utils.formatUnits(order.order.price, 6)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Available</div>
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
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm"
        />
        <button
          onClick={() => onFill(order.id, Number(fillAmount))}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm ${
            isBuy
              ? "bg-gradient-to-br from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] text-white border border-white/20"
              : "bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] hover:from-[#9b2c2c] hover:to-[#7f1d1d] text-white border border-white/20"
          }`}
        >
          {isBuy ? "Sell" : "Buy"}
        </button>
      </div>
    </div>
  );
};

export default function MarketplaceClient() {
  const [tokenId, setTokenId] = useState(1);
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
    <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#374151] text-white relative">
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
              <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center shadow-2xl shadow-black/20 border border-white/20 backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">GreenXAiEDX</h1>
                <p className="text-gray-400 text-sm">
                  Trade Green Credits with mUSDC
                </p>
              </div>
            </div>
            <button
              onClick={loadActiveOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] border border-white/20 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-white/20">
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "marketplace"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Order History
            </button>
          </div>
        </div>

        {activeTab === "marketplace" && (
          <div className="space-y-6">
            {/* Create Order Section */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">
                  Create New Order
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token ID
                  </label>
                  <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm"
                  />
                  <div className="mt-1 text-xs text-white">
                    Your balance: {userBalance} credits
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (mUSDC)
                  </label>
                  <input
                    type="text"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm"
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
                    placeholder="1"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handlePlaceSellOrder}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] hover:from-[#9b2c2c] hover:to-[#7f1d1d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
                  >
                    {loading ? "..." : "Sell"}
                  </button>
                  <button
                    onClick={handlePlaceBuyOrder}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-br from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
                  >
                    {loading ? "..." : "Buy"}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm">
                <Shield className="w-5 h-5 text-white flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  All transactions are settled in mUSDC stablecoin
                </p>
              </div>
            </div>

            {/* Active Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sell Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Sell Orders
                    <span className="text-xs bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] text-white rounded-full px-2 py-1 border border-white/20 backdrop-blur-sm">
                      {activeSellOrders.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {loading && activeSellOrders.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-white/10 backdrop-blur-sm">
                      Loading orders...
                    </div>
                  ) : activeSellOrders.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-white/10 backdrop-blur-sm">
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
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Buy Orders
                    <span className="text-xs bg-gradient-to-br from-[#374151] to-[#1F2937] text-white rounded-full px-2 py-1 border border-white/20 backdrop-blur-sm">
                      {activeBuyOrders.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  {loading && activeBuyOrders.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-white/10 backdrop-blur-sm">
                      Loading orders...
                    </div>
                  ) : activeBuyOrders.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-white/10 backdrop-blur-sm">
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
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Completed Orders
                <span className="text-xs bg-gradient-to-br from-[#4B5563] to-[#374151] text-white rounded-full px-2 py-1 border border-white/20 backdrop-blur-sm">
                  {completedOrders.length}
                </span>
              </h3>
              <button
                onClick={loadCompletedOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#4B5563] to-[#374151] hover:from-[#6B7280] hover:to-[#4B5563] border border-white/20 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
              {completedOrders.length === 0 ? (
                <div className="text-gray-500 text-center py-16 bg-gradient-to-br from-white/5 to-transparent rounded-lg border border-white/10 backdrop-blur-sm">
                  No completed orders yet
                </div>
              ) : (
                completedOrders.map((c) => (
                  <div
                    key={c.id}
                    className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white font-semibold">
                          #{c.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            c.order.isBuy
                              ? "bg-gradient-to-br from-[#374151] to-[#1F2937] text-white border border-white/20"
                              : "bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] text-white border border-white/20"
                          }`}
                        >
                          {c.order.isBuy ? "BUY" : "SELL"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Token #{c.order.tokenId?.toString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">
                        ${ethers.utils.formatUnits(c.order.price, 6)} mUSDC
                      </span>
                      <span className="text-gray-400">
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
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
