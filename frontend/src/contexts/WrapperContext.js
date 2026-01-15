"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "./Web3Context";
import { CONTRACTS, DECIMALS } from "../config/contracts";
import WrappedGreenCreditFactoryAbi from "../../../ABI/WrappedGreenCreditFactoryAbi";
import WrappedGreenCreditERC20Abi from "../../../ABI/WrappedGreenCreditERC20Abi";
import GreenCreditTokenAbi from "../../../ABI/GreenCreditTokenAbi";

const WrapperContext = createContext({
  // State
  wrappers: {}, // tokenId => wrapperAddress
  wrappedBalances: {}, // wrapperAddress => balance
  erc1155Balances: {}, // tokenId => balance
  loading: false,
  error: null,
  txHash: null,

  // Actions
  createWrapper: async () => {},
  getWrapperAddress: async () => {},
  approveERC1155ToWrapper: async () => {},
  wrapCredits: async () => {},
  unwrapCredits: async () => {},
  getWrappedBalance: async () => {},
  getERC1155Balance: async () => {},
  approveWrappedToken: async () => {},
  getAllWrappers: async () => {},
  clearError: () => {},
});

export function WrapperProvider({ children }) {
  const { signer, account, provider, isConnected } = useWeb3();

  const [wrappers, setWrappers] = useState({});
  const [wrappedBalances, setWrappedBalances] = useState({});
  const [erc1155Balances, setErc1155Balances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
    setTxHash(null);
  }, []);

  // Get Factory contract
  const getFactoryContract = useCallback(
    (useSigner = false) => {
      if (!provider) throw new Error("Provider not available");
      const signerOrProvider = useSigner && signer ? signer : provider;
      return new ethers.Contract(
        CONTRACTS.WRAPPED_GREEN_CREDIT_FACTORY,
        WrappedGreenCreditFactoryAbi,
        signerOrProvider
      );
    },
    [provider, signer]
  );

  // Get GreenCreditToken contract
  const getGreenCreditContract = useCallback(
    (useSigner = false) => {
      if (!provider) throw new Error("Provider not available");
      const signerOrProvider = useSigner && signer ? signer : provider;
      return new ethers.Contract(
        CONTRACTS.GREEN_CREDIT_TOKEN,
        GreenCreditTokenAbi,
        signerOrProvider
      );
    },
    [provider, signer]
  );

  // Get Wrapped Token contract
  const getWrapperContract = useCallback(
    (wrapperAddress, useSigner = false) => {
      if (!provider) throw new Error("Provider not available");
      const signerOrProvider = useSigner && signer ? signer : provider;
      return new ethers.Contract(
        wrapperAddress,
        WrappedGreenCreditERC20Abi,
        signerOrProvider
      );
    },
    [provider, signer]
  );

  // Get wrapper address for a tokenId
  const getWrapperAddress = useCallback(
    async (tokenId) => {
      try {
        const factory = getFactoryContract(false);
        const wrapperAddress = await factory.wrapperOf(
          CONTRACTS.GREEN_CREDIT_TOKEN,
          tokenId
        );

        if (wrapperAddress !== ethers.constants.AddressZero) {
          setWrappers((prev) => ({ ...prev, [tokenId]: wrapperAddress }));
        }

        return wrapperAddress;
      } catch (err) {
        console.error("Error getting wrapper address:", err);
        return ethers.constants.AddressZero;
      }
    },
    [getFactoryContract]
  );

  // Create new wrapper for a tokenId
  const createWrapper = useCallback(
    async (tokenId, name, symbol) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const factory = getFactoryContract(true);

        // Check if wrapper already exists
        const existingWrapper = await factory.wrapperOf(
          CONTRACTS.GREEN_CREDIT_TOKEN,
          tokenId
        );
        if (existingWrapper !== ethers.constants.AddressZero) {
          setWrappers((prev) => ({ ...prev, [tokenId]: existingWrapper }));
          setError("Wrapper already exists for this token ID");
          setLoading(false);
          return existingWrapper;
        }

        console.log("⏳ Creating wrapper for tokenId:", tokenId);
        const tx = await factory.createWrapper(
          CONTRACTS.GREEN_CREDIT_TOKEN,
          tokenId,
          name,
          symbol
        );
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Wrapper created:", receipt);

        // Get the wrapper address from events
        const event = receipt.events?.find((e) => e.event === "WrapperCreated");
        const wrapperAddress = event?.args?.wrapper;

        if (wrapperAddress) {
          setWrappers((prev) => ({ ...prev, [tokenId]: wrapperAddress }));
        }

        return wrapperAddress || (await getWrapperAddress(tokenId));
      } catch (err) {
        console.error("❌ Create wrapper error:", err);
        setError(err.reason || err.message || "Failed to create wrapper");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, getFactoryContract, getWrapperAddress]
  );

  // Approve ERC-1155 to wrapper (setApprovalForAll)
  const approveERC1155ToWrapper = useCallback(
    async (wrapperAddress) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const greenCredit = getGreenCreditContract(true);

        // Check if already approved
        const isApproved = await greenCredit.isApprovedForAll(
          account,
          wrapperAddress
        );
        if (isApproved) {
          console.log("Already approved");
          setLoading(false);
          return true;
        }

        console.log("⏳ Approving ERC-1155 to wrapper...");
        const tx = await greenCredit.setApprovalForAll(wrapperAddress, true);
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ ERC-1155 approved to wrapper:", receipt);

        return receipt;
      } catch (err) {
        console.error("❌ Approval error:", err);
        setError(err.reason || err.message || "Failed to approve ERC-1155");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, account, getGreenCreditContract]
  );

  // Wrap ERC-1155 -> ERC-20
  const wrapCredits = useCallback(
    async (wrapperAddress, amount, tokenId) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const wrapper = getWrapperContract(wrapperAddress, true);
        const greenCredit = getGreenCreditContract(false);

        // Pre-flight checks for better error messages
        console.log("🔍 Pre-flight checks for wrapping...");

        // 1. Check ERC-1155 balance
        const balance = await greenCredit.balanceOf(account, tokenId);
        console.log(
          `💰 ERC-1155 balance for tokenId ${tokenId}:`,
          balance.toString()
        );
        if (balance.lt(amount)) {
          throw new Error(
            `Insufficient ERC-1155 balance. You have ${balance.toString()} but trying to wrap ${amount}`
          );
        }
        console.log("✅ Balance check passed");

        // 2. Check if user approved wrapper for ERC-1155
        const isApproved = await greenCredit.isApprovedForAll(
          account,
          wrapperAddress
        );
        console.log("🔐 ERC-1155 approved for wrapper:", isApproved);
        if (!isApproved) {
          throw new Error(
            'Please approve the wrapper contract first. Click "Approve" before wrapping.'
          );
        }
        console.log("✅ Approval check passed");

        // 3. Check if user's token is frozen
        try {
          const isFrozen = await greenCredit.isUserTokenFrozen(
            account,
            tokenId
          );
          console.log(`❄️ Token ${tokenId} frozen for user:`, isFrozen);
          if (isFrozen) {
            throw new Error(
              `Your tokenId ${tokenId} is frozen and cannot be wrapped.`
            );
          }
          console.log("✅ Frozen check passed");
        } catch (freezeErr) {
          if (freezeErr.message.includes("frozen")) throw freezeErr;
          console.log("⚠️ Could not check frozen status, continuing...");
        }

        // 4. Check credit info (exists and not revoked)
        try {
          const creditInfo = await greenCredit.getCreditInfo(tokenId);
          console.log("📋 Credit info:", creditInfo);

          // Handle both tuple and object returns
          const exists = creditInfo.exists ?? creditInfo[4] ?? false;
          const revoked = creditInfo.revoked ?? creditInfo[5] ?? false;

          if (!exists) {
            throw new Error(
              `Credit tokenId ${tokenId} does not exist. Please register/mint it first on /green-credits page.`
            );
          }
          if (revoked) {
            throw new Error(
              `Credit tokenId ${tokenId} has been revoked and cannot be wrapped.`
            );
          }
          console.log("✅ Credit exists and not revoked");
        } catch (infoErr) {
          if (
            infoErr.message.includes("exist") ||
            infoErr.message.includes("revoked")
          ) {
            throw infoErr;
          }
          console.log(
            "⚠️ Could not verify credit info, continuing...",
            infoErr.message
          );
        }

        console.log("⏳ Wrapping credits...");
        console.log("📋 Wrap params:", {
          wrapperAddress,
          amount: amount.toString(),
          tokenId,
        });

        const tx = await wrapper.wrap(amount);
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Credits wrapped:", receipt);

        // Refresh balances
        await getWrappedBalance(wrapperAddress);
        await getERC1155Balance(tokenId);

        return receipt;
      } catch (err) {
        console.error("❌ Wrap error:", err);
        setError(err.reason || err.message || "Failed to wrap credits");
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signer, isConnected, account, getWrapperContract, getGreenCreditContract]
  );

  // Unwrap ERC-20 -> ERC-1155
  const unwrapCredits = useCallback(
    async (wrapperAddress, amount) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const wrapper = getWrapperContract(wrapperAddress, true);

        // Amount should be in wei (1 credit = 1e18 ERC20)
        const amountWei = ethers.utils.parseUnits(
          amount.toString(),
          DECIMALS.ERC20_WRAPPED
        );

        console.log("⏳ Unwrapping credits...");
        const tx = await wrapper.unwrap(amountWei);
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Credits unwrapped:", receipt);

        // Refresh balances
        await getWrappedBalance(wrapperAddress);

        return receipt;
      } catch (err) {
        console.error("❌ Unwrap error:", err);
        setError(err.reason || err.message || "Failed to unwrap credits");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, getWrapperContract]
  );

  // Get wrapped ERC-20 balance
  const getWrappedBalance = useCallback(
    async (wrapperAddress, userAddress = null) => {
      try {
        const address = userAddress || account;
        if (
          !address ||
          !wrapperAddress ||
          wrapperAddress === ethers.constants.AddressZero
        ) {
          return "0";
        }

        const wrapper = getWrapperContract(wrapperAddress, false);
        const balance = await wrapper.balanceOf(address);
        const formatted = ethers.utils.formatUnits(
          balance,
          DECIMALS.ERC20_WRAPPED
        );

        setWrappedBalances((prev) => ({
          ...prev,
          [wrapperAddress]: formatted,
        }));
        return formatted;
      } catch (err) {
        console.error("Error getting wrapped balance:", err);
        return "0";
      }
    },
    [account, getWrapperContract]
  );

  // Get ERC-1155 balance for a tokenId
  const getERC1155Balance = useCallback(
    async (tokenId, userAddress = null) => {
      try {
        const address = userAddress || account;
        if (!address) return "0";

        const greenCredit = getGreenCreditContract(false);
        const balance = await greenCredit.balanceOf(address, tokenId);
        const formatted = balance.toString();

        setErc1155Balances((prev) => ({ ...prev, [tokenId]: formatted }));
        return formatted;
      } catch (err) {
        console.error("Error getting ERC-1155 balance:", err);
        return "0";
      }
    },
    [account, getGreenCreditContract]
  );

  // Approve wrapped token for a spender (e.g., Router)
  const approveWrappedToken = useCallback(
    async (wrapperAddress, spender, amount) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const wrapper = getWrapperContract(wrapperAddress, true);
        const amountWei = ethers.utils.parseUnits(
          amount.toString(),
          DECIMALS.ERC20_WRAPPED
        );

        console.log("⏳ Approving wrapped token...");
        const tx = await wrapper.approve(spender, amountWei);
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Wrapped token approved:", receipt);

        return receipt;
      } catch (err) {
        console.error("❌ Approval error:", err);
        setError(
          err.reason || err.message || "Failed to approve wrapped token"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, getWrapperContract]
  );

  // Get all wrappers from factory
  const getAllWrappers = useCallback(async () => {
    try {
      const factory = getFactoryContract(false);
      const totalWrappers = await factory.totalWrappers();
      const count = totalWrappers.toNumber();

      const wrapperList = [];
      for (let i = 0; i < count; i++) {
        const wrapperAddress = await factory.allWrappers(i);
        if (wrapperAddress !== ethers.constants.AddressZero) {
          const wrapper = getWrapperContract(wrapperAddress, false);
          const [name, symbol, tokenId] = await Promise.all([
            wrapper.name(),
            wrapper.symbol(),
            wrapper.tokenId(),
          ]);
          wrapperList.push({
            address: wrapperAddress,
            name,
            symbol,
            tokenId: tokenId.toNumber(),
          });
        }
      }

      return wrapperList;
    } catch (err) {
      console.error("Error getting all wrappers:", err);
      return [];
    }
  }, [getFactoryContract, getWrapperContract]);

  const value = {
    // State
    wrappers,
    wrappedBalances,
    erc1155Balances,
    loading,
    error,
    txHash,

    // Actions
    createWrapper,
    getWrapperAddress,
    approveERC1155ToWrapper,
    wrapCredits,
    unwrapCredits,
    getWrappedBalance,
    getERC1155Balance,
    approveWrappedToken,
    getAllWrappers,
    clearError,
  };

  return (
    <WrapperContext.Provider value={value}>{children}</WrapperContext.Provider>
  );
}

export const useWrapper = () => {
  return useContext(WrapperContext);
};

export default WrapperContext;
