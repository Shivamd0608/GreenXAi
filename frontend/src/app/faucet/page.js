"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useFaucet } from "@/contexts/FaucetContext";
import {
  Droplets,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { CHAIN_CONFIG } from "@/config/contracts";

export default function FaucetPage() {
  const { account, isConnected, connectWallet, balance } = useWeb3();
  const {
    mockUsdcBalance,
    faucetInfo,
    loading,
    error,
    txHash,
    claimFaucet,
    getMockUSDCBalance,
    getFaucetInfo,
    clearError,
  } = useFaucet();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && account) {
      getMockUSDCBalance();
      getFaucetInfo();
    }
  }, [isConnected, account, getMockUSDCBalance, getFaucetInfo]);

  const handleClaim = async () => {
    clearError();
    await claimFaucet();
  };

  const formatWaitTime = (seconds) => {
    if (seconds <= 0) return "Ready!";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 mb-6">
              <Droplets className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              MockUSDC Faucet
            </h1>
            <p className="text-gray-400 text-lg">
              Get test mUSDC tokens for trading on {CHAIN_CONFIG.chainName}
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            {!isConnected ? (
              // Not Connected State
              <div className="text-center py-8">
                <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-400 mb-6">
                  Connect your wallet to claim free test tokens
                </p>
                <button
                  onClick={connectWallet}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              // Connected State
              <div className="space-y-6">
                {/* Wallet Info */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Connected Wallet</span>
                    <span className="text-white font-mono text-sm">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">MNT Balance</span>
                    <span className="text-white">
                      {parseFloat(balance).toFixed(4)} MNT
                    </span>
                  </div>
                </div>

                {/* mUSDC Balance */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-6 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        Your mUSDC Balance
                      </p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {parseFloat(mockUsdcBalance).toLocaleString()} mUSDC
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-2xl">💵</span>
                    </div>
                  </div>
                </div>

                {/* Faucet Info */}
                {faucetInfo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-gray-400 text-sm">Amount per Claim</p>
                      <p className="text-xl font-semibold text-white mt-1">
                        {parseFloat(faucetInfo.faucetAmount).toLocaleString()}{" "}
                        mUSDC
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-gray-400 text-sm">Cooldown</p>
                      <p className="text-xl font-semibold text-white mt-1 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        {faucetInfo.canClaim
                          ? "Ready!"
                          : formatWaitTime(faucetInfo.waitTime)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400">{error}</p>
                      <button
                        onClick={clearError}
                        className="text-red-400/70 text-sm hover:text-red-400 mt-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {txHash && !error && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
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

                {/* Claim Button */}
                <button
                  onClick={handleClaim}
                  disabled={loading || (faucetInfo && !faucetInfo.canClaim)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : faucetInfo && !faucetInfo.canClaim ? (
                    <>
                      <Clock className="w-5 h-5" />
                      Wait {formatWaitTime(faucetInfo.waitTime)}
                    </>
                  ) : (
                    <>
                      <Droplets className="w-5 h-5" />
                      Claim {faucetInfo?.faucetAmount || "10,000"} mUSDC
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2">💧 Free Tokens</h3>
              <p className="text-sm text-gray-400">
                Claim test mUSDC tokens every 2 minutes for free
              </p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2">🔄 Use in AMM</h3>
              <p className="text-sm text-gray-400">
                Add liquidity or swap tokens on GreenAiDEX
              </p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2">
                📊 Trade Credits
              </h3>
              <p className="text-sm text-gray-400">
                Use mUSDC to buy wrapped green credits
              </p>
            </div>
          </div>

          {/* Network Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Connected to{" "}
              <span className="text-cyan-400">{CHAIN_CONFIG.chainName}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
