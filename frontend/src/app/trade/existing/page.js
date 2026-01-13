'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SellExistingPage() {
  const [selectedOption, setSelectedOption] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sell Existing Tokens</h1>
            <p className="text-gray-600">Choose how you want to sell your existing tokenized credits</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div 
              className={`border-2 rounded-xl p-8 cursor-pointer transition-all ${
                selectedOption === 'amm' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => setSelectedOption('amm')}
            >
              <div className="text-4xl mb-6 text-center">🤖</div>
              <h3 className="text-xl font-semibold text-center mb-4">AMM (Automated Market Maker)</h3>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Instant swaps at market price
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Best for quick sales
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  0.3% trading fee
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Mantle L2: ~$0.01 gas fee
                </li>
              </ul>
              <div className="text-center">
                {selectedOption === 'amm' && (
                  <Link href="/trade/amm">
                    <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                      Go to AMM Swap →
                    </button>
                  </Link>
                )}
              </div>
            </div>

            <div 
              className={`border-2 rounded-xl p-8 cursor-pointer transition-all ${
                selectedOption === 'orderbook' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedOption('orderbook')}
            >
              <div className="text-4xl mb-6 text-center">📈</div>
              <h3 className="text-xl font-semibold text-center mb-4">Orderbook Trading</h3>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  Set your own price
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  Best for large orders
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  0.25% platform fee
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">✓</span>
                  USDC settlement
                </li>
              </ul>
              <div className="text-center">
                {selectedOption === 'orderbook' && (
                  <Link href="/marketplace">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                      Go to Orderbook →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Token Balances */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Your Token Balances</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'wCARBON', balance: '1,500', value: '$15,750' },
                { name: 'wWATER', balance: '800', value: '$8,800' },
                { name: 'wRENEWABLE', balance: '1,200', value: '$14,400' },
              ].map((token) => (
                <div key={token.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{token.name}</div>
                      <div className="text-sm text-gray-500">Tokenized Credits</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{token.balance}</div>
                      <div className="text-sm text-gray-500">{token.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-2">ℹ️ How to Sell</h3>
            <ol className="text-sm text-blue-700 space-y-2">
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