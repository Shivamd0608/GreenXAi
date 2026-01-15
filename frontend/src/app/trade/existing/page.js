'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SellExistingPage() {
  const [selectedOption, setSelectedOption] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Sell Existing Tokens</h1>
            <p className="text-gray-300">Choose how you want to sell your existing tokenized credits</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div 
              className={`border-2 rounded-xl p-8 cursor-pointer transition-all backdrop-blur-sm ${
                selectedOption === 'amm' 
                  ? 'border-emerald-500 bg-emerald-500/10' 
                  : 'border-gray-600 hover:border-emerald-400 bg-gradient-to-br from-gray-800 to-gray-700'
              }`}
              onClick={() => setSelectedOption('amm')}
            >
              <div className="text-4xl mb-6 text-center">🤖</div>
              <h3 className="text-xl font-semibold text-center mb-4 text-white">AMM (Automated Market Maker)</h3>
              <ul className="space-y-3 text-gray-300 mb-6">
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Instant swaps at market price
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Best for quick sales
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-2">✓</span>
                  0.3% trading fee
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-400 mr-2">✓</span>
                  Mantle L2: ~$0.01 gas fee
                </li>
              </ul>
              <div className="text-center">
                {selectedOption === 'amm' && (
                  <Link href="/trade/amm">
                    <button className="bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 border border-gray-500">
                      Go to AMM Swap →
                    </button>
                  </Link>
                )}
              </div>
            </div>

            <div 
              className={`border-2 rounded-xl p-8 cursor-pointer transition-all backdrop-blur-sm ${
                selectedOption === 'orderbook' 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-gray-600 hover:border-cyan-400 bg-gradient-to-br from-gray-800 to-gray-700'
              }`}
              onClick={() => setSelectedOption('orderbook')}
            >
              <div className="text-4xl mb-6 text-center">📈</div>
              <h3 className="text-xl font-semibold text-center mb-4 text-white">Orderbook Trading</h3>
              <ul className="space-y-3 text-gray-300 mb-6">
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Set your own price
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Best for large orders
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">✓</span>
                  0.25% platform fee
                </li>
                <li className="flex items-center">
                  <span className="text-cyan-400 mr-2">✓</span>
                  USDC settlement
                </li>
              </ul>
              <div className="text-center">
                {selectedOption === 'orderbook' && (
                  <Link href="/marketplace">
                    <button className="bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 border border-gray-500">
                      Go to Orderbook →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Token Balances */}
          <div className="mt-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 text-white">Your Token Balances</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'wCARBON', balance: '1,500', value: '$15,750' },
                { name: 'wWATER', balance: '800', value: '$8,800' },
                { name: 'wRENEWABLE', balance: '1,200', value: '$14,400' },
              ].map((token) => (
                <div key={token.name} className="border border-gray-600 rounded-lg p-4 bg-gradient-to-br from-gray-800/50 to-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{token.name}</div>
                      <div className="text-sm text-gray-400">Tokenized Credits</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{token.balance}</div>
                      <div className="text-sm text-gray-400">{token.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="font-semibold text-cyan-300 mb-2">ℹ️ How to Sell</h3>
            <ol className="text-sm text-cyan-200 space-y-2">
              <li>1. Select AMM for instant swaps or Orderbook for price control</li>
              <li>2. Connect your wallet to see actual balances</li>
              <li>3. Approve tokens for trading (one-time per token)</li>
              <li>4. Execute trade on Mantle L2 (ultra-low fees)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
