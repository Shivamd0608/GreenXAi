"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAMM } from "@/contexts/AMMContext";
import { useFaucet } from "@/contexts/FaucetContext";
import { useWrapper } from "@/contexts/WrapperContext";
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowDownUp,
  Plus,
  RefreshCw,
  Droplets,
  TrendingUp,
  Settings,
} from "lucide-react";
import { CHAIN_CONFIG, CONTRACTS, DECIMALS } from "@/config/contracts";
import { ethers } from "ethers";

export default function AMMPage() {
  const { account, isConnected, connectWallet } = useWeb3();
  const {
    pools,
    loading: ammLoading,
    error: ammError,
    txHash,
    approveToken,
    addLiquidity,
    removeLiquidity,
    swapExactTokensForTokens,
    getAmountsOut,
    getPools,
    getReserves,
    getPairAddress,
    getTokenBalance,
    clearError: clearAmmError,
  } = useAMM();
  const { mockUsdcBalance, getMockUSDCBalance } = useFaucet();
  const { getAllWrappers } = useWrapper();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("swap"); // 'swap', 'liquidity', 'pools'
  const [availableTokens, setAvailableTokens] = useState([]);
  const [tokenBalances, setTokenBalances] = useState({});

  // Swap state
  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [swapLoading, setSwapLoading] = useState(false);

  // Liquidity state
  const [liquidityTokenA, setLiquidityTokenA] = useState("");
  const [liquidityTokenB, setLiquidityTokenB] = useState("");
  const [liquidityAmountA, setLiquidityAmountA] = useState("");
  const [liquidityAmountB, setLiquidityAmountB] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load available tokens (MockUSDC + wrapped tokens)
  const loadTokens = useCallback(async () => {
    if (!isConnected) return;

    const tokens = [
      {
        address: CONTRACTS.MOCK_USDC,
        symbol: "mUSDC",
        name: "Mock USDC",
        decimals: DECIMALS.MOCK_USDC,
      },
    ];

    // Get wrapped tokens
    const wrapperList = await getAllWrappers();
    wrapperList.forEach((wrapper) => {
      tokens.push({
        address: wrapper.address,
        symbol: wrapper.symbol,
        name: wrapper.name,
        decimals: DECIMALS.ERC20_WRAPPED,
      });
    });

    setAvailableTokens(tokens);

    // Load balances
    const balances = {};
    for (const token of tokens) {
      const balance = await getTokenBalance(
        token.address,
        account,
        token.decimals
      );
      balances[token.address] = balance;
    }
    setTokenBalances(balances);
  }, [isConnected, account, getAllWrappers, getTokenBalance]);

  useEffect(() => {
    loadTokens();
    getPools();
    getMockUSDCBalance();
  }, [loadTokens, getPools, getMockUSDCBalance]);

  // Get quote when input changes
  useEffect(() => {
    const getQuote = async () => {
      if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) === 0) {
        setAmountOut("");
        return;
      }

      try {
        const tokenInData = availableTokens.find((t) => t.address === tokenIn);
        if (!tokenInData) return;

        const amounts = await getAmountsOut(
          amountIn,
          [tokenIn, tokenOut],
          tokenInData.decimals
        );
        if (amounts.length > 1) {
          const tokenOutData = availableTokens.find(
            (t) => t.address === tokenOut
          );
          const formatted = ethers.utils.formatUnits(
            amounts[1],
            tokenOutData?.decimals || 18
          );
          setAmountOut(formatted);
        }
      } catch (err) {
        console.error("Quote error:", err);
        setAmountOut("");
      }
    };

    getQuote();
  }, [tokenIn, tokenOut, amountIn, availableTokens, getAmountsOut]);

  // Handle swap
  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn) return;

    setSwapLoading(true);
    clearAmmError();

    try {
      const tokenInData = availableTokens.find((t) => t.address === tokenIn);
      const tokenOutData = availableTokens.find((t) => t.address === tokenOut);

      // First approve
      await approveToken(tokenIn, amountIn, tokenInData.decimals);

      // Calculate min amount out with slippage
      const slippagePercent = parseFloat(slippage) / 100;
      const minAmountOut = (
        parseFloat(amountOut) *
        (1 - slippagePercent)
      ).toString();

      // Execute swap
      const result = await swapExactTokensForTokens({
        amountIn,
        amountOutMin: minAmountOut,
        path: [tokenIn, tokenOut],
        decimalsIn: tokenInData.decimals,
        decimalsOut: tokenOutData.decimals,
      });

      if (result) {
        setAmountIn("");
        setAmountOut("");
        await loadTokens(); // Refresh balances
      }
    } catch (err) {
      console.error("Swap error:", err);
    } finally {
      setSwapLoading(false);
    }
  };

  // Handle add liquidity
  const handleAddLiquidity = async () => {
    if (
      !liquidityTokenA ||
      !liquidityTokenB ||
      !liquidityAmountA ||
      !liquidityAmountB
    )
      return;

    clearAmmError();

    try {
      const tokenAData = availableTokens.find(
        (t) => t.address === liquidityTokenA
      );
      const tokenBData = availableTokens.find(
        (t) => t.address === liquidityTokenB
      );

      // Approve both tokens
      await approveToken(
        liquidityTokenA,
        liquidityAmountA,
        tokenAData.decimals
      );
      await approveToken(
        liquidityTokenB,
        liquidityAmountB,
        tokenBData.decimals
      );

      // Add liquidity
      const result = await addLiquidity({
        tokenA: liquidityTokenA,
        tokenB: liquidityTokenB,
        amountADesired: liquidityAmountA,
        amountBDesired: liquidityAmountB,
        decimalsA: tokenAData.decimals,
        decimalsB: tokenBData.decimals,
      });

      if (result) {
        setLiquidityAmountA("");
        setLiquidityAmountB("");
        await loadTokens();
        await getPools();
      }
    } catch (err) {
      console.error("Add liquidity error:", err);
    }
  };

  // Swap token positions
  const handleFlipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  if (!mounted) return null;

  const loading = ammLoading || swapLoading;
  const error = ammError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              GreenAiDEX AMM
            </h1>
            <p className="text-gray-400">
              Swap tokens and provide liquidity on {CHAIN_CONFIG.chainName}
            </p>
          </div>

          {!isConnected ? (
            // Not Connected
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-6">Connect to start trading</p>
              <button
                onClick={connectWallet}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex bg-slate-800/50 backdrop-blur rounded-xl p-1 mb-6">
                {["swap", "liquidity", "pools"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all capitalize ${
                      activeTab === tab
                        ? "bg-cyan-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Main Card */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                {/* SWAP TAB */}
                {activeTab === "swap" && (
                  <div className="space-y-4">
                    {/* Token In */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">From</span>
                        <span className="text-gray-500 text-sm">
                          Balance:{" "}
                          {tokenIn
                            ? parseFloat(tokenBalances[tokenIn] || "0").toFixed(
                                4
                              )
                            : "0"}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          value={amountIn}
                          onChange={(e) => setAmountIn(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-gray-600"
                        />
                        <select
                          value={tokenIn}
                          onChange={(e) => setTokenIn(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Select</option>
                          {availableTokens.map((token) => (
                            <option key={token.address} value={token.address}>
                              {token.symbol}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Swap Arrow */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleFlipTokens}
                        className="p-2 bg-slate-900 border border-slate-700 rounded-lg hover:border-cyan-500 transition-colors"
                      >
                        <ArrowDownUp className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    {/* Token Out */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">To</span>
                        <span className="text-gray-500 text-sm">
                          Balance:{" "}
                          {tokenOut
                            ? parseFloat(
                                tokenBalances[tokenOut] || "0"
                              ).toFixed(4)
                            : "0"}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          value={amountOut}
                          readOnly
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-gray-600"
                        />
                        <select
                          value={tokenOut}
                          onChange={(e) => setTokenOut(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Select</option>
                          {availableTokens
                            .filter((t) => t.address !== tokenIn)
                            .map((token) => (
                              <option key={token.address} value={token.address}>
                                {token.symbol}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Slippage Settings */}
                    <div className="flex items-center justify-between bg-slate-900/30 rounded-lg p-3">
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Slippage Tolerance
                      </span>
                      <div className="flex gap-2">
                        {["0.1", "0.5", "1.0"].map((val) => (
                          <button
                            key={val}
                            onClick={() => setSlippage(val)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              slippage === val
                                ? "bg-cyan-500 text-white"
                                : "bg-slate-800 text-gray-400 hover:text-white"
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Info */}
                    {amountIn && amountOut && parseFloat(amountIn) > 0 && (
                      <div className="bg-slate-900/30 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Rate</span>
                          <span className="text-white">
                            1{" "}
                            {availableTokens.find((t) => t.address === tokenIn)
                              ?.symbol || "Token"}{" "}
                            ={" "}
                            {(
                              parseFloat(amountOut) / parseFloat(amountIn)
                            ).toFixed(6)}{" "}
                            {availableTokens.find((t) => t.address === tokenOut)
                              ?.symbol || "Token"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-400">
                            Minimum received
                          </span>
                          <span className="text-white">
                            {(
                              parseFloat(amountOut) *
                              (1 - parseFloat(slippage) / 100)
                            ).toFixed(6)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Swap Button */}
                    <button
                      onClick={handleSwap}
                      disabled={loading || !tokenIn || !tokenOut || !amountIn}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Swapping...
                        </>
                      ) : (
                        <>
                          <ArrowDownUp className="w-5 h-5" />
                          Swap
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* LIQUIDITY TAB */}
                {activeTab === "liquidity" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Add Liquidity
                    </h3>

                    {/* Token A */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">Token A</span>
                        <span className="text-gray-500 text-sm">
                          Balance:{" "}
                          {liquidityTokenA
                            ? parseFloat(
                                tokenBalances[liquidityTokenA] || "0"
                              ).toFixed(4)
                            : "0"}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          value={liquidityAmountA}
                          onChange={(e) => setLiquidityAmountA(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-xl font-semibold text-white outline-none placeholder-gray-600"
                        />
                        <select
                          value={liquidityTokenA}
                          onChange={(e) => setLiquidityTokenA(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Select</option>
                          {availableTokens.map((token) => (
                            <option key={token.address} value={token.address}>
                              {token.symbol}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Plus Icon */}
                    <div className="flex justify-center">
                      <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg">
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Token B */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">Token B</span>
                        <span className="text-gray-500 text-sm">
                          Balance:{" "}
                          {liquidityTokenB
                            ? parseFloat(
                                tokenBalances[liquidityTokenB] || "0"
                              ).toFixed(4)
                            : "0"}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          value={liquidityAmountB}
                          onChange={(e) => setLiquidityAmountB(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 bg-transparent text-xl font-semibold text-white outline-none placeholder-gray-600"
                        />
                        <select
                          value={liquidityTokenB}
                          onChange={(e) => setLiquidityTokenB(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Select</option>
                          {availableTokens
                            .filter((t) => t.address !== liquidityTokenA)
                            .map((token) => (
                              <option key={token.address} value={token.address}>
                                {token.symbol}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Add Liquidity Button */}
                    <button
                      onClick={handleAddLiquidity}
                      disabled={
                        loading ||
                        !liquidityTokenA ||
                        !liquidityTokenB ||
                        !liquidityAmountA ||
                        !liquidityAmountB
                      }
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Adding Liquidity...
                        </>
                      ) : (
                        <>
                          <Droplets className="w-5 h-5" />
                          Add Liquidity
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                      LP Fee: 0.3% on all trades
                    </p>
                  </div>
                )}

                {/* POOLS TAB */}
                {activeTab === "pools" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Available Pools
                      </h3>
                      <button
                        onClick={getPools}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <RefreshCw
                          className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>

                    {pools.length === 0 ? (
                      <div className="text-center py-12">
                        <Droplets className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">
                          No liquidity pools found
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Be the first to add liquidity!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pools.map((pool) => (
                          <div
                            key={pool.address}
                            className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-white">
                                {pool.symbol0}/{pool.symbol1}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                {pool.address.slice(0, 8)}...
                                {pool.address.slice(-6)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">
                                  {pool.symbol0} Reserve
                                </span>
                                <p className="text-white font-medium">
                                  {parseFloat(pool.reserve0).toFixed(4)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  {pool.symbol1} Reserve
                                </span>
                                <p className="text-white font-medium">
                                  {parseFloat(pool.reserve1).toFixed(4)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                              <span className="text-gray-400 text-sm">
                                Total LP Supply
                              </span>
                              <p className="text-white font-medium">
                                {parseFloat(pool.totalSupply).toFixed(4)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={clearAmmError}
                        className="text-red-400/70 text-sm hover:text-red-400 mt-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {txHash && !error && (
                  <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-emerald-400">
                        Transaction successful!
                      </p>
                      <a
                        href={`${CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400/70 text-sm hover:text-emerald-400 flex items-center gap-1 mt-1"
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">mUSDC Balance</p>
                  <p className="text-xl font-bold text-white">
                    {parseFloat(mockUsdcBalance).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">Total Pools</p>
                  <p className="text-xl font-bold text-white">{pools.length}</p>
                </div>
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">LP Fee</p>
                  <p className="text-xl font-bold text-white">0.3%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
