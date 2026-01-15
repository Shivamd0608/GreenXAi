"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "./Web3Context";
import { CONTRACTS, DECIMALS } from "../config/contracts";
import GreenXchangeV2FactoryAbi from "../../../ABI/GreenXchangeV2FactoryAbi";
import GreenXchangeV2PairAbi from "../../../ABI/GreenXchangeV2PairAbi";
import GreenXchangeV2RouterFullAbi from "../../../ABI/GreenXchangeV2RouterFullAbi";

// Generic ERC20 ABI for approvals and balances
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

const AMMContext = createContext({
  // State
  pools: [],
  reserves: {},
  loading: false,
  error: null,
  txHash: null,

  // Actions
  approveToken: async () => {},
  addLiquidity: async () => {},
  removeLiquidity: async () => {},
  swapExactTokensForTokens: async () => {},
  getAmountsOut: async () => {},
  getAmountsIn: async () => {},
  getPools: async () => {},
  getReserves: async () => {},
  getPairAddress: async () => {},
  getTokenBalance: async () => {},
  clearError: () => {},
});

export function AMMProvider({ children }) {
  const { signer, account, provider, isConnected } = useWeb3();

  const [pools, setPools] = useState([]);
  const [reserves, setReserves] = useState({});
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
        CONTRACTS.AMM_FACTORY,
        GreenXchangeV2FactoryAbi,
        signerOrProvider
      );
    },
    [provider, signer]
  );

  // Get Router contract
  const getRouterContract = useCallback(
    (useSigner = false) => {
      if (!provider) throw new Error("Provider not available");
      const signerOrProvider = useSigner && signer ? signer : provider;
      return new ethers.Contract(
        CONTRACTS.AMM_ROUTER,
        GreenXchangeV2RouterFullAbi,
        signerOrProvider
      );
    },
    [provider, signer]
  );

  // Get Pair contract
  const getPairContract = useCallback(
    (pairAddress, useSigner = false) => {
      if (!provider) throw new Error("Provider not available");
      const signerOrProvider = useSigner && signer ? signer : provider;
      return new ethers.Contract(
        pairAddress,
        GreenXchangeV2PairAbi,
        signerOrProvider
      );
    },
    [provider, signer]
  );

  // Get ERC20 contract
  const getERC20Contract = useCallback(
    (tokenAddress, useSigner = false) => {
      if (!provider) throw new Error("Provider not available");
      const signerOrProvider = useSigner && signer ? signer : provider;
      return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
    },
    [provider, signer]
  );

  // Approve token for Router
  const approveToken = useCallback(
    async (tokenAddress, amount, decimals = 18) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const token = getERC20Contract(tokenAddress, true);
        const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);

        // Check current allowance
        const currentAllowance = await token.allowance(
          account,
          CONTRACTS.AMM_ROUTER
        );
        if (currentAllowance.gte(amountWei)) {
          console.log("Already approved");
          setLoading(false);
          return true;
        }

        console.log("⏳ Approving token for Router...");
        const tx = await token.approve(
          CONTRACTS.AMM_ROUTER,
          ethers.constants.MaxUint256
        );
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Token approved:", receipt);

        return receipt;
      } catch (err) {
        console.error("❌ Approval error:", err);
        setError(err.reason || err.message || "Failed to approve token");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, account, getERC20Contract]
  );

  // Add liquidity
  const addLiquidity = useCallback(
    async ({
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin = "0",
      amountBMin = "0",
      deadline = 1861316834,
    }) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const router = getRouterContract(true);

        // Dynamically fetch decimals from the token contracts
        const tokenAContract = getERC20Contract(tokenA, true);
        const tokenBContract = getERC20Contract(tokenB, true);

        const [decimalsA, decimalsB] = await Promise.all([
          tokenAContract.decimals().catch(() => 18),
          tokenBContract.decimals().catch(() => 18),
        ]);

        console.log(`📊 Token decimals - A: ${decimalsA}, B: ${decimalsB}`);

        const amountAWei = ethers.utils.parseUnits(
          amountADesired.toString(),
          decimalsA
        );
        const amountBWei = ethers.utils.parseUnits(
          amountBDesired.toString(),
          decimalsB
        );
        const amountAMinWei = ethers.utils.parseUnits(
          amountAMin.toString(),
          decimalsA
        );
        const amountBMinWei = ethers.utils.parseUnits(
          amountBMin.toString(),
          decimalsB
        );

        // Check balances before proceeding
        const [balanceA, balanceB] = await Promise.all([
          tokenAContract.balanceOf(account),
          tokenBContract.balanceOf(account),
        ]);

        console.log(
          `💰 User balances - A: ${ethers.utils.formatUnits(
            balanceA,
            decimalsA
          )}, B: ${ethers.utils.formatUnits(balanceB, decimalsB)}`
        );

        if (balanceA.lt(amountAWei)) {
          throw new Error(
            `Insufficient balance for Token A. Have: ${ethers.utils.formatUnits(
              balanceA,
              decimalsA
            )}, Need: ${amountADesired}`
          );
        }
        if (balanceB.lt(amountBWei)) {
          throw new Error(
            `Insufficient balance for Token B. Have: ${ethers.utils.formatUnits(
              balanceB,
              decimalsB
            )}, Need: ${amountBDesired}`
          );
        }

        // Check allowances
        const [allowanceA, allowanceB] = await Promise.all([
          tokenAContract.allowance(account, CONTRACTS.AMM_ROUTER),
          tokenBContract.allowance(account, CONTRACTS.AMM_ROUTER),
        ]);

        console.log(
          `🔐 Allowances - A: ${ethers.utils.formatUnits(
            allowanceA,
            decimalsA
          )}, B: ${ethers.utils.formatUnits(allowanceB, decimalsB)}`
        );

        if (allowanceA.lt(amountAWei)) {
          throw new Error(
            `Insufficient allowance for Token A. Approved: ${ethers.utils.formatUnits(
              allowanceA,
              decimalsA
            )}, Need: ${amountADesired}. Please approve first.`
          );
        }
        if (allowanceB.lt(amountBWei)) {
          throw new Error(
            `Insufficient allowance for Token B. Approved: ${ethers.utils.formatUnits(
              allowanceB,
              decimalsB
            )}, Need: ${amountBDesired}. Please approve first.`
          );
        }

        console.log("📋 AddLiquidity params:", {
          tokenA,
          tokenB,
          amountAWei: amountAWei.toString(),
          amountBWei: amountBWei.toString(),
          amountAMinWei: amountAMinWei.toString(),
          amountBMinWei: amountBMinWei.toString(),
          to: account,
          deadline,
        });

        // Simulate the transaction first
        console.log("🔍 Simulating addLiquidity with callStatic...");
        try {
          await router.callStatic.addLiquidity(
            tokenA,
            tokenB,
            amountAWei,
            amountBWei,
            amountAMinWei,
            amountBMinWei,
            account,
            deadline
          );
          console.log("✅ Simulation passed");
        } catch (simErr) {
          console.error("❌ Simulation failed:", simErr);
          const reason =
            simErr?.reason ||
            simErr?.error?.message ||
            simErr?.message ||
            "Unknown error";
          throw new Error(`Transaction will fail: ${reason}`);
        }

        console.log("⏳ Adding liquidity...");
        const tx = await router.addLiquidity(
          tokenA,
          tokenB,
          amountAWei,
          amountBWei,
          amountAMinWei,
          amountBMinWei,
          account,
          deadline
        );
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Liquidity added:", receipt);

        // Refresh pools
        await getPools();

        return receipt;
      } catch (err) {
        console.error("❌ Add liquidity error:", err);
        setError(err.reason || err.message || "Failed to add liquidity");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, account, getRouterContract, getERC20Contract]
  );

  // Remove liquidity
  const removeLiquidity = useCallback(
    async ({
      tokenA,
      tokenB,
      liquidity,
      amountAMin = "0",
      amountBMin = "0",
      deadline = 1861316834,
    }) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const router = getRouterContract(true);

        // Dynamically fetch decimals from the token contracts
        const tokenAContract = getERC20Contract(tokenA, false);
        const tokenBContract = getERC20Contract(tokenB, false);

        const [decimalsA, decimalsB] = await Promise.all([
          tokenAContract.decimals().catch(() => 18),
          tokenBContract.decimals().catch(() => 18),
        ]);

        console.log(`📊 Token decimals - A: ${decimalsA}, B: ${decimalsB}`);

        const liquidityWei = ethers.utils.parseUnits(liquidity.toString(), 18); // LP tokens are 18 decimals
        const amountAMinWei = ethers.utils.parseUnits(
          amountAMin.toString(),
          decimalsA
        );
        const amountBMinWei = ethers.utils.parseUnits(
          amountBMin.toString(),
          decimalsB
        );

        console.log("⏳ Removing liquidity...");
        const tx = await router.removeLiquidity(
          tokenA,
          tokenB,
          liquidityWei,
          amountAMinWei,
          amountBMinWei,
          account,
          deadline
        );
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Liquidity removed:", receipt);

        // Refresh pools
        await getPools();

        return receipt;
      } catch (err) {
        console.error("❌ Remove liquidity error:", err);
        setError(err.reason || err.message || "Failed to remove liquidity");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, account, getRouterContract, getERC20Contract]
  );

  // Swap exact tokens for tokens
  const swapExactTokensForTokens = useCallback(
    async ({ amountIn, amountOutMin = "0", path, deadline = 1861316834 }) => {
      if (!signer || !isConnected) {
        setError("Please connect your wallet first");
        return null;
      }

      if (!path || path.length < 2) {
        setError("Invalid swap path");
        return null;
      }

      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const router = getRouterContract(true);

        // Dynamically fetch decimals from the token contracts
        const tokenInContract = getERC20Contract(path[0], false);
        const tokenOutContract = getERC20Contract(path[path.length - 1], false);

        const [decimalsIn, decimalsOut] = await Promise.all([
          tokenInContract.decimals().catch(() => 18),
          tokenOutContract.decimals().catch(() => 18),
        ]);

        console.log(
          `📊 Swap decimals - In: ${decimalsIn}, Out: ${decimalsOut}`
        );

        const amountInWei = ethers.utils.parseUnits(
          amountIn.toString(),
          decimalsIn
        );
        const amountOutMinWei = ethers.utils.parseUnits(
          amountOutMin.toString(),
          decimalsOut
        );

        console.log("⏳ Swapping tokens...");
        const tx = await router.swapExactTokensForTokens(
          amountInWei,
          amountOutMinWei,
          path,
          account,
          deadline
        );
        setTxHash(tx.hash);
        console.log("📡 Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Swap completed:", receipt);

        return receipt;
      } catch (err) {
        console.error("❌ Swap error:", err);
        setError(err.reason || err.message || "Failed to swap tokens");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [signer, isConnected, account, getRouterContract, getERC20Contract]
  );

  // Get amounts out (quote)
  const getAmountsOut = useCallback(
    async (amountIn, path) => {
      try {
        if (!path || path.length < 2) return [];

        const router = getRouterContract(false);

        // Dynamically fetch decimals for the input token
        const tokenInContract = getERC20Contract(path[0], false);
        const decimalsIn = await tokenInContract.decimals().catch(() => 18);

        const amountInWei = ethers.utils.parseUnits(
          amountIn.toString(),
          decimalsIn
        );
        const amounts = await router.getAmountsOut(amountInWei, path);

        return amounts.map((a) => a.toString());
      } catch (err) {
        console.error("Error getting amounts out:", err);
        return [];
      }
    },
    [getRouterContract, getERC20Contract]
  );

  // Get amounts in (reverse quote)
  const getAmountsIn = useCallback(
    async (amountOut, path) => {
      try {
        if (!path || path.length < 2) return [];

        const router = getRouterContract(false);

        // Dynamically fetch decimals for the output token
        const tokenOutContract = getERC20Contract(path[path.length - 1], false);
        const decimalsOut = await tokenOutContract.decimals().catch(() => 18);

        const amountOutWei = ethers.utils.parseUnits(
          amountOut.toString(),
          decimalsOut
        );
        const amounts = await router.getAmountsIn(amountOutWei, path);

        return amounts.map((a) => a.toString());
      } catch (err) {
        console.error("Error getting amounts in:", err);
        return [];
      }
    },
    [getRouterContract, getERC20Contract]
  );

  // Get pair address
  const getPairAddress = useCallback(
    async (tokenA, tokenB) => {
      try {
        const factory = getFactoryContract(false);
        const pairAddress = await factory.getPair(tokenA, tokenB);
        return pairAddress;
      } catch (err) {
        console.error("Error getting pair address:", err);
        return ethers.constants.AddressZero;
      }
    },
    [getFactoryContract]
  );

  // Get reserves for a pair
  const getReserves = useCallback(
    async (pairAddress) => {
      try {
        if (!pairAddress || pairAddress === ethers.constants.AddressZero) {
          return { reserve0: "0", reserve1: "0", token0: "", token1: "" };
        }

        const pair = getPairContract(pairAddress, false);
        const [reserves, token0, token1] = await Promise.all([
          pair.getReserves(),
          pair.token0(),
          pair.token1(),
        ]);

        const reserveData = {
          reserve0: reserves[0].toString(),
          reserve1: reserves[1].toString(),
          token0,
          token1,
        };

        setReserves((prev) => ({ ...prev, [pairAddress]: reserveData }));
        return reserveData;
      } catch (err) {
        console.error("Error getting reserves:", err);
        return { reserve0: "0", reserve1: "0", token0: "", token1: "" };
      }
    },
    [getPairContract]
  );

  // Get all pools
  const getPools = useCallback(async () => {
    try {
      const factory = getFactoryContract(false);
      const pairCount = await factory.allPairsLength();
      const count = pairCount.toNumber();

      const poolList = [];
      for (let i = 0; i < count; i++) {
        const pairAddress = await factory.allPairs(i);
        const pair = getPairContract(pairAddress, false);

        const [token0, token1, reserves, totalSupply] = await Promise.all([
          pair.token0(),
          pair.token1(),
          pair.getReserves(),
          pair.totalSupply(),
        ]);

        // Get token info
        const token0Contract = getERC20Contract(token0, false);
        const token1Contract = getERC20Contract(token1, false);

        const [symbol0, symbol1, decimals0, decimals1] = await Promise.all([
          token0Contract.symbol().catch(() => "UNKNOWN"),
          token1Contract.symbol().catch(() => "UNKNOWN"),
          token0Contract.decimals().catch(() => 18),
          token1Contract.decimals().catch(() => 18),
        ]);

        poolList.push({
          address: pairAddress,
          token0,
          token1,
          symbol0,
          symbol1,
          decimals0,
          decimals1,
          reserve0: ethers.utils.formatUnits(reserves[0], decimals0),
          reserve1: ethers.utils.formatUnits(reserves[1], decimals1),
          totalSupply: ethers.utils.formatUnits(totalSupply, 18),
        });
      }

      setPools(poolList);
      return poolList;
    } catch (err) {
      console.error("Error getting pools:", err);
      return [];
    }
  }, [getFactoryContract, getPairContract, getERC20Contract]);

  // Get token balance
  const getTokenBalance = useCallback(
    async (tokenAddress, userAddress = null, decimals = 18) => {
      try {
        const address = userAddress || account;
        if (!address) return "0";

        const token = getERC20Contract(tokenAddress, false);
        const balance = await token.balanceOf(address);
        return ethers.utils.formatUnits(balance, decimals);
      } catch (err) {
        console.error("Error getting token balance:", err);
        return "0";
      }
    },
    [account, getERC20Contract]
  );

  const value = {
    // State
    pools,
    reserves,
    loading,
    error,
    txHash,

    // Actions
    approveToken,
    addLiquidity,
    removeLiquidity,
    swapExactTokensForTokens,
    getAmountsOut,
    getAmountsIn,
    getPools,
    getReserves,
    getPairAddress,
    getTokenBalance,
    clearError,
  };

  return <AMMContext.Provider value={value}>{children}</AMMContext.Provider>;
}

export const useAMM = () => {
  return useContext(AMMContext);
};

export default AMMContext;
