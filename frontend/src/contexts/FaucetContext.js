'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';
import { CONTRACTS, DECIMALS } from '../config/contracts';
import MockUSDCAbi from '../../../ABI/MockUSDCAbi';

const FaucetContext = createContext({
  // State
  mockUsdcBalance: '0',
  faucetInfo: null,
  loading: false,
  error: null,
  txHash: null,
  
  // Actions
  claimFaucet: async () => {},
  getMockUSDCBalance: async () => {},
  getFaucetInfo: async () => {},
  approveMockUSDC: async () => {},
  clearError: () => {},
});

export function FaucetProvider({ children }) {
  const { signer, account, provider, isConnected } = useWeb3();
  
  const [mockUsdcBalance, setMockUsdcBalance] = useState('0');
  const [faucetInfo, setFaucetInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
    setTxHash(null);
  }, []);

  // Get MockUSDC contract instance
  const getMockUSDCContract = useCallback((useSigner = false) => {
    if (!provider) throw new Error('Provider not available');
    const signerOrProvider = useSigner && signer ? signer : provider;
    return new ethers.Contract(CONTRACTS.MOCK_USDC, MockUSDCAbi, signerOrProvider);
  }, [provider, signer]);

  // Get user's MockUSDC balance
  const getMockUSDCBalance = useCallback(async (userAddress = null) => {
    try {
      const address = userAddress || account;
      if (!address) return '0';
      
      const contract = getMockUSDCContract(false);
      const balance = await contract.balanceOf(address);
      const formatted = ethers.utils.formatUnits(balance, DECIMALS.MOCK_USDC);
      setMockUsdcBalance(formatted);
      return formatted;
    } catch (err) {
      console.error('Error getting MockUSDC balance:', err);
      return '0';
    }
  }, [account, getMockUSDCContract]);

  // Get faucet info (cooldown, can claim, etc.)
  const getFaucetInfo = useCallback(async (userAddress = null) => {
    try {
      const address = userAddress || account;
      if (!address) return null;

      const contract = getMockUSDCContract(false);
      
      const [faucetAmount, faucetCooldown, info] = await Promise.all([
        contract.faucetAmount(),
        contract.faucetCooldown(),
        contract.getFaucetInfo(address),
      ]);

      const faucetData = {
        faucetAmount: ethers.utils.formatUnits(faucetAmount, DECIMALS.MOCK_USDC),
        faucetCooldown: faucetCooldown.toNumber(),
        lastClaimTimestamp: info.timestamp.toNumber(),
        canClaim: info.canClaim,
        waitTime: info.waitTime.toNumber(),
      };

      setFaucetInfo(faucetData);
      return faucetData;
    } catch (err) {
      console.error('Error getting faucet info:', err);
      return null;
    }
  }, [account, getMockUSDCContract]);

  // Claim from faucet
  const claimFaucet = useCallback(async () => {
    if (!signer || !isConnected) {
      setError('Please connect your wallet first');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = getMockUSDCContract(true);
      
      console.log('⏳ Claiming from faucet...');
      const tx = await contract.faucet();
      setTxHash(tx.hash);
      console.log('📡 Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Faucet claimed:', receipt);

      // Refresh balance and info
      await getMockUSDCBalance();
      await getFaucetInfo();

      return receipt;
    } catch (err) {
      console.error('❌ Faucet claim error:', err);
      setError(err.reason || err.message || 'Failed to claim from faucet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [signer, isConnected, getMockUSDCContract, getMockUSDCBalance, getFaucetInfo]);

  // Approve MockUSDC for a spender
  const approveMockUSDC = useCallback(async (spender, amount) => {
    if (!signer || !isConnected) {
      setError('Please connect your wallet first');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = getMockUSDCContract(true);
      const amountWei = ethers.utils.parseUnits(amount.toString(), DECIMALS.MOCK_USDC);
      
      console.log('⏳ Approving MockUSDC...');
      const tx = await contract.approve(spender, amountWei);
      setTxHash(tx.hash);
      console.log('📡 Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ MockUSDC approved:', receipt);

      return receipt;
    } catch (err) {
      console.error('❌ Approval error:', err);
      setError(err.reason || err.message || 'Failed to approve MockUSDC');
      return null;
    } finally {
      setLoading(false);
    }
  }, [signer, isConnected, getMockUSDCContract]);

  const value = {
    // State
    mockUsdcBalance,
    faucetInfo,
    loading,
    error,
    txHash,
    
    // Actions
    claimFaucet,
    getMockUSDCBalance,
    getFaucetInfo,
    approveMockUSDC,
    clearError,
  };

  return (
    <FaucetContext.Provider value={value}>
      {children}
    </FaucetContext.Provider>
  );
}

export const useFaucet = () => {
  return useContext(FaucetContext);
};

export default FaucetContext;
