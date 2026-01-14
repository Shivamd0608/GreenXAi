'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useWrapper } from '@/contexts/WrapperContext';
import { 
  Package, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  ArrowRight,
  RefreshCw,
  Plus,
  ArrowDownUp
} from 'lucide-react';
import { CHAIN_CONFIG, CONTRACTS } from '@/config/contracts';
import { ethers } from 'ethers';

// Step indicator component
const StepIndicator = ({ step, currentStep, title, completed }) => {
  const isActive = step === currentStep;
  const isCompleted = completed || step < currentStep;
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
      isActive 
        ? 'bg-emerald-500/10 border-emerald-500/50' 
        : isCompleted 
          ? 'bg-slate-800/50 border-emerald-500/30' 
          : 'bg-slate-800/30 border-slate-700/50'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        isCompleted 
          ? 'bg-emerald-500 text-white' 
          : isActive 
            ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500' 
            : 'bg-slate-700 text-gray-400'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`font-medium ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`}>
        {title}
      </span>
    </div>
  );
};

export default function WrapPage() {
  const { account, isConnected, connectWallet } = useWeb3();
  const {
    wrappers,
    wrappedBalances,
    erc1155Balances,
    loading,
    error,
    txHash,
    createWrapper,
    getWrapperAddress,
    approveERC1155ToWrapper,
    wrapCredits,
    unwrapCredits,
    getWrappedBalance,
    getERC1155Balance,
    getAllWrappers,
    clearError,
  } = useWrapper();

  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [allWrappersList, setAllWrappersList] = useState([]);
  const [selectedWrapper, setSelectedWrapper] = useState(null);
  const [mode, setMode] = useState('wrap'); // 'wrap' or 'unwrap'

  // Form state
  const [tokenId, setTokenId] = useState('');
  const [wrapperName, setWrapperName] = useState('');
  const [wrapperSymbol, setWrapperSymbol] = useState('');
  const [wrapAmount, setWrapAmount] = useState('');
  const [unwrapAmount, setUnwrapAmount] = useState('');

  // Status tracking
  const [wrapperCreated, setWrapperCreated] = useState(false);
  const [erc1155Approved, setErc1155Approved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load existing wrappers
  const loadWrappers = useCallback(async () => {
    if (isConnected) {
      const wrapperList = await getAllWrappers();
      setAllWrappersList(wrapperList);
    }
  }, [isConnected, getAllWrappers]);

  useEffect(() => {
    loadWrappers();
  }, [loadWrappers]);

  // Check if wrapper exists when tokenId changes
  useEffect(() => {
    const checkWrapper = async () => {
      if (tokenId && isConnected) {
        const addr = await getWrapperAddress(tokenId);
        if (addr && addr !== ethers.constants.AddressZero) {
          setWrapperCreated(true);
          setCurrentStep(2);
          // Load balances
          await getERC1155Balance(tokenId);
          await getWrappedBalance(addr);
        } else {
          setWrapperCreated(false);
          setCurrentStep(1);
        }
      }
    };
    checkWrapper();
  }, [tokenId, isConnected, getWrapperAddress, getERC1155Balance, getWrappedBalance]);

  // Step 1: Create wrapper
  const handleCreateWrapper = async () => {
    if (!tokenId || !wrapperName || !wrapperSymbol) {
      return;
    }
    clearError();
    const wrapperAddr = await createWrapper(tokenId, wrapperName, wrapperSymbol);
    if (wrapperAddr && wrapperAddr !== ethers.constants.AddressZero) {
      setWrapperCreated(true);
      setCurrentStep(2);
      await loadWrappers();
    }
  };

  // Step 2: Approve ERC-1155
  const handleApprove = async () => {
    const wrapperAddr = wrappers[tokenId];
    if (!wrapperAddr) return;
    
    clearError();
    const result = await approveERC1155ToWrapper(wrapperAddr);
    if (result) {
      setErc1155Approved(true);
      setCurrentStep(3);
    }
  };

  // Step 3: Wrap credits
  const handleWrap = async () => {
    const wrapperAddr = wrappers[tokenId];
    if (!wrapperAddr || !wrapAmount) return;
    
    clearError();
    const result = await wrapCredits(wrapperAddr, wrapAmount);
    if (result) {
      // Refresh balances
      await getERC1155Balance(tokenId);
      await getWrappedBalance(wrapperAddr);
      setWrapAmount('');
    }
  };

  // Unwrap credits
  const handleUnwrap = async () => {
    const wrapperAddr = wrappers[tokenId] || selectedWrapper?.address;
    if (!wrapperAddr || !unwrapAmount) return;
    
    clearError();
    const result = await unwrapCredits(wrapperAddr, unwrapAmount);
    if (result) {
      // Refresh balances
      const tid = selectedWrapper?.tokenId || tokenId;
      await getERC1155Balance(tid);
      await getWrappedBalance(wrapperAddr);
      setUnwrapAmount('');
    }
  };

  // Select existing wrapper
  const handleSelectWrapper = async (wrapper) => {
    setSelectedWrapper(wrapper);
    setTokenId(wrapper.tokenId.toString());
    await getERC1155Balance(wrapper.tokenId);
    await getWrappedBalance(wrapper.address);
    setWrapperCreated(true);
    setCurrentStep(2);
  };

  if (!mounted) return null;

  const currentWrapperAddress = wrappers[tokenId] || selectedWrapper?.address;
  const currentERC1155Balance = erc1155Balances[tokenId] || '0';
  const currentWrappedBalance = wrappedBalances[currentWrapperAddress] || '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 mb-6">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Wrap Green Credits</h1>
            <p className="text-gray-400 text-lg">
              Convert ERC-1155 credits to ERC-20 for DeFi compatibility
            </p>
          </div>

          {!isConnected ? (
            // Not Connected State
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
              <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Connect your wallet to wrap green credits</p>
              <button
                onClick={connectWallet}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Steps */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Wrapping Steps</h3>
                <StepIndicator step={1} currentStep={currentStep} title="Create ERC-20 Wrapper" completed={wrapperCreated} />
                <StepIndicator step={2} currentStep={currentStep} title="Approve ERC-1155" completed={erc1155Approved} />
                <StepIndicator step={3} currentStep={currentStep} title="Wrap Credits" completed={false} />

                {/* Existing Wrappers */}
                {allWrappersList.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Existing Wrappers</h3>
                    <div className="space-y-2">
                      {allWrappersList.map((wrapper) => (
                        <button
                          key={wrapper.address}
                          onClick={() => handleSelectWrapper(wrapper)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedWrapper?.address === wrapper.address
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30'
                          }`}
                        >
                          <p className="font-medium text-white">{wrapper.symbol}</p>
                          <p className="text-xs text-gray-400 truncate">{wrapper.address}</p>
                          <p className="text-xs text-purple-400">Token ID: {wrapper.tokenId}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  {/* Mode Toggle */}
                  <div className="flex bg-slate-900/50 rounded-xl p-1 mb-6">
                    <button
                      onClick={() => setMode('wrap')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        mode === 'wrap'
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Wrap
                    </button>
                    <button
                      onClick={() => setMode('unwrap')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        mode === 'unwrap'
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Unwrap
                    </button>
                  </div>

                  {mode === 'wrap' ? (
                    // WRAP MODE
                    <div className="space-y-6">
                      {/* Step 1: Create Wrapper */}
                      {!wrapperCreated && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">Step 1: Create ERC-20 Wrapper</h3>
                          
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Token ID</label>
                            <input
                              type="number"
                              value={tokenId}
                              onChange={(e) => setTokenId(e.target.value)}
                              placeholder="Enter ERC-1155 token ID"
                              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Wrapper Name</label>
                              <input
                                type="text"
                                value={wrapperName}
                                onChange={(e) => setWrapperName(e.target.value)}
                                placeholder="e.g., Wrapped Carbon Credit"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Wrapper Symbol</label>
                              <input
                                type="text"
                                value={wrapperSymbol}
                                onChange={(e) => setWrapperSymbol(e.target.value.toUpperCase())}
                                placeholder="e.g., wCARBON"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>

                          <button
                            onClick={handleCreateWrapper}
                            disabled={loading || !tokenId || !wrapperName || !wrapperSymbol}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating Wrapper...
                              </>
                            ) : (
                              <>
                                <Plus className="w-5 h-5" />
                                Create Wrapper
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Step 2 & 3: Approve and Wrap */}
                      {wrapperCreated && (
                        <div className="space-y-6">
                          {/* Balances */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                              <p className="text-sm text-gray-400">ERC-1155 Balance</p>
                              <p className="text-2xl font-bold text-white">{currentERC1155Balance}</p>
                              <p className="text-xs text-gray-500">Token ID: {tokenId}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                              <p className="text-sm text-gray-400">Wrapped ERC-20 Balance</p>
                              <p className="text-2xl font-bold text-white">{parseFloat(currentWrappedBalance).toFixed(2)}</p>
                              <p className="text-xs text-gray-500 truncate">{currentWrapperAddress?.slice(0, 10)}...</p>
                            </div>
                          </div>

                          {/* Approve Button */}
                          {!erc1155Approved && (
                            <button
                              onClick={handleApprove}
                              disabled={loading}
                              className="w-full py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-semibold rounded-xl hover:bg-yellow-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Approve ERC-1155 for Wrapper
                                </>
                              )}
                            </button>
                          )}

                          {/* Wrap Input */}
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Amount to Wrap</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={wrapAmount}
                                onChange={(e) => setWrapAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() => setWrapAmount(currentERC1155Balance)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm hover:text-purple-300"
                              >
                                MAX
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              1 ERC-1155 credit = 1 ERC-20 token (with 18 decimals)
                            </p>
                          </div>

                          <button
                            onClick={handleWrap}
                            disabled={loading || !wrapAmount || parseInt(wrapAmount) > parseInt(currentERC1155Balance)}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Wrapping...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-5 h-5" />
                                Wrap {wrapAmount || '0'} Credits
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // UNWRAP MODE
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white">Unwrap ERC-20 → ERC-1155</h3>

                      {/* Select Wrapper */}
                      {!currentWrapperAddress ? (
                        <div className="text-center py-8">
                          <ArrowDownUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">Select a wrapper from the sidebar or enter a token ID above</p>
                        </div>
                      ) : (
                        <>
                          {/* Balances */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                              <p className="text-sm text-gray-400">Wrapped ERC-20 Balance</p>
                              <p className="text-2xl font-bold text-white">{parseFloat(currentWrappedBalance).toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                              <p className="text-sm text-gray-400">ERC-1155 Balance</p>
                              <p className="text-2xl font-bold text-white">{currentERC1155Balance}</p>
                            </div>
                          </div>

                          {/* Unwrap Input */}
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Amount to Unwrap</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={unwrapAmount}
                                onChange={(e) => setUnwrapAmount(e.target.value)}
                                placeholder="Enter amount (whole numbers)"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() => setUnwrapAmount(Math.floor(parseFloat(currentWrappedBalance)).toString())}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm hover:text-purple-300"
                              >
                                MAX
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Must be whole numbers (1 ERC-20 token = 1 ERC-1155 credit)
                            </p>
                          </div>

                          <button
                            onClick={handleUnwrap}
                            disabled={loading || !unwrapAmount || parseFloat(unwrapAmount) > parseFloat(currentWrappedBalance)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Unwrapping...
                              </>
                            ) : (
                              <>
                                <ArrowDownUp className="w-5 h-5" />
                                Unwrap {unwrapAmount || '0'} Tokens
                              </>
                            )}
                          </button>
                        </>
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
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-emerald-400">Transaction successful!</p>
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
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">📦 ERC-1155 → ERC-20</h3>
              <p className="text-sm text-gray-400">
                Convert your green credits from ERC-1155 to ERC-20 format for use in DeFi protocols like AMMs.
              </p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">🔄 1:1 Ratio</h3>
              <p className="text-sm text-gray-400">
                Each ERC-1155 credit wraps into exactly 1 ERC-20 token (with 18 decimals for precision).
              </p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">💱 Reversible</h3>
              <p className="text-sm text-gray-400">
                You can unwrap your ERC-20 tokens back to ERC-1155 credits at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
