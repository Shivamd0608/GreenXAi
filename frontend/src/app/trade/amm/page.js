'use client'

import { useState } from 'react'
import Navigation from '@/components/ui/Navigation'
import WalletConnect from '@/components/web3/WalletConnect'

export default function AMMPage() {
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#374151] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">AMM Swap</h1>
            <p className="text-gray-400">Instant swaps using liquidity pools. Powered by Uniswap V2 fork on Mantle L2.</p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-2xl shadow-black/20">
            <div className="space-y-6">
              {/* From Token */}
              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">From</span>
                  <span className="text-sm text-gray-400">Balance: 1000 USDC</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full text-2xl font-semibold bg-transparent outline-none text-white placeholder-gray-500"
                  />
                  <div className="flex items-center bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                    <span className="font-semibold text-white">USDC</span>
                    <span className="ml-2 text-gray-400">▼</span>
                  </div>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <div className="bg-white/10 p-2 rounded-full border border-white/20">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>

              {/* To Token */}
              <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">To</span>
                  <span className="text-sm text-gray-400">Balance: 0 wCARBON</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full text-2xl font-semibold bg-transparent outline-none text-white placeholder-gray-500"
                  />
                  <div className="flex items-center bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                    <span className="font-semibold text-white">wCARBON</span>
                    <span className="ml-2 text-gray-400">▼</span>
                  </div>
                </div>
              </div>

              {/* Price Info */}
              <div className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="font-semibold text-white">1 wCARBON = 10.52 USDC</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Slippage Tolerance</span>
                  <span className="font-semibold text-white">0.5%</span>
                </div>
              </div>

              {/* Swap Button */}
              <button className="w-full bg-gradient-to-r from-[#374151] to-[#1F2937] hover:from-[#4B5563] hover:to-[#374151] text-white py-4 rounded-xl font-semibold text-lg transition-colors border border-white/20 backdrop-blur-sm">
                Swap
              </button>

              {/* Mantle Info */}
              <div className="text-center text-sm text-gray-400">
                <p>💸 Mantle L2 Fee: ~$0.01</p>
                <p className="mt-1">⚡ Transaction time: ~1 second</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-white/5 to-transparent p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-gray-300">Total Value Locked</h3>
              <p className="text-2xl font-bold text-white">$4.2M</p>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-transparent p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-gray-300">24h Volume</h3>
              <p className="text-2xl font-bold text-white">$124K</p>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-transparent p-4 rounded-xl border border-white/20 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-gray-300">LP Fee</h3>
              <p className="text-2xl font-bold text-white">0.30%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
