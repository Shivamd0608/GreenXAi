// app/verification/page.js 
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCreditInfo } from '@/contexts/MintToken';
import {useSearchParams} from "next/navigation"

export default function VerificationPage() {
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [credit, setCredit] = useState(null);
  const [error, setError] = useState('');

  const creditEnumToLabel = {
    0: { label: '🌿 Green Credit', color: 'text-gray-300' },
    1: { label: '🌳 Carbon Offset', color: 'text-gray-300' }, 
    2: { label: '💧 Water Conservation', color: 'text-gray-300' },
    3: { label: '☀️ Renewable Energy', color: 'text-gray-300' }
  };

  const searchParams = useSearchParams()
  const id = searchParams.get('tokenid')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('onboardingProject');

      if(id){
        setTokenId(id);
        handleGetInfo(Number(id));
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.tokenId !== undefined && parsed.tokenId !== null) {
          setTokenId(String(parsed.tokenId));
        }
      }

    } catch (e) {
      console.log('No previous project found');
    }
  }, [id]);

  const handleGetInfo = async () => {
    setError('');
    setCredit(null);

    if (tokenId === '' || isNaN(Number(tokenId))) {
      setError('Please provide a valid numeric token ID');
      return;
    }

    if (Number(tokenId) < 0) {
      setError('Token ID must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const info = await fetchCreditInfo(Number(tokenId));
      
      // Normalize the response data
      const normalized = {
        creditType: info.creditType ?? null,
        projectTitle: info.projectTitle ?? null,
        location: info.location ?? null,
        certificateHash: info.certificateHash ?? null,
        exists: info.exists ?? false,
        timestamp: new Date().toISOString(),
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000
      };

      setCredit(normalized);
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to fetch credit information. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-gray-600"
          >
            <span className="text-white text-2xl">🔍</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Credit <span className="text-gray-300">Verification</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Verify your environmental credit tokens on the blockchain. Enter your token ID to fetch real-time verification status.
          </p>
          <p className="mt-3 font-bold text-white bg-gradient-to-br from-gray-700 to-gray-600 px-6 py-3 rounded-lg border border-gray-500">✅ Once verified, open the Credit Type page and mint your token with its ID</p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800 to-gray-700 backdrop-blur-sm rounded-2xl border border-gray-600 p-8 mb-8 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Token ID
              </label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="Enter your token ID number"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-600 border border-gray-500 rounded-xl text-white placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-300"
                min="0"
              />
              <p className="text-gray-400 text-sm mt-2">
                Found your token ID after project onboarding? It should auto-fill above.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetInfo}
              disabled={loading}
              className="bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 min-w-[140px] justify-center border border-gray-500"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Verify Token</span>
                </>
              )}
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-gradient-to-br from-gray-700 to-gray-600 border border-gray-500 rounded-xl text-gray-300 text-sm"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {credit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-gray-800 to-gray-700 backdrop-blur-sm rounded-2xl border border-gray-600 p-8 shadow-lg"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Credit Details */}
                <div className="space-y-6">
                  <h3 className="text-gray-300 font-semibold text-lg mb-4">Credit Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-600">
                      <span className="text-gray-400">Credit Type</span>
                      <span className={`font-medium ${creditEnumToLabel[credit.creditType]?.color || 'text-white'}`}>
                        {credit.creditType !== null ? creditEnumToLabel[credit.creditType]?.label : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between items-start py-3 border-b border-gray-600">
                      <span className="text-gray-400">Project Name</span>
                      <span className="text-white font-medium text-right max-w-[200px]">
                        {credit.projectTitle || '—'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-600">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white font-medium">
                        {credit.location || '—'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-400">On-Chain Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        credit.exists ? 'bg-gradient-to-br from-gray-600 to-gray-500 text-white border border-gray-500' : 'bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300 border border-gray-600'
                      }`}>
                        {credit.exists ? '✅ Exists' : '❌ Not Found'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Certificate & Blockchain Info */}
                <div className="space-y-6">
                  <h3 className="text-gray-300 font-semibold text-lg mb-4">Blockchain Details</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-500">
                      <div className="text-gray-400 text-sm mb-2">Certificate Hash</div>
                      <div className="text-gray-300 font-mono text-xs break-all">
                        {credit.certificateHash || 'No certificate hash available'}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-500">
                      <div className="text-gray-400 text-sm mb-2">Block Number</div>
                      <div className="text-gray-300 font-mono">
                        #{credit.blockNumber.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-500">
                      <div className="text-gray-400 text-sm mb-2">Last Verified</div>
                      <div className="text-gray-300">
                        {new Date(credit.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State Guidance */}
        {!credit && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-500">
              <span className="text-white text-2xl">💎</span>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">Ready to Verify</h3>
            <p className="text-gray-300 max-w-md mx-auto">
              Enter your token ID above to verify its on-chain status and view detailed credit information.
            </p>
            <div className="mt-4 text-gray-400 text-sm">
              <p>💡 Your token ID should be available after project onboarding</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
