import { ethers } from "ethers";
import orderbookAbi from "../../../ABI/GreenXchangeOrderbookAbi";
import greenCreditAbi from "../../../ABI/GreenCreditTokenAbi";

// ---- Contract addresses (from environment variables) ----
const ORDERBOOK_ADDRESS = process.env.NEXT_PUBLIC_ORDERBOOK;
const GREEN_CREDIT_ADDRESS = process.env.NEXT_PUBLIC_GREEN_CREDIT_TOKEN;
const MUSDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC;

// Runtime validation - log warnings if addresses are missing
if (typeof window !== "undefined") {
  if (!ORDERBOOK_ADDRESS)
    console.error("⚠️ NEXT_PUBLIC_ORDERBOOK is not set in .env");
  if (!GREEN_CREDIT_ADDRESS)
    console.error("⚠️ NEXT_PUBLIC_GREEN_CREDIT_TOKEN is not set in .env");
  if (!MUSDC_ADDRESS)
    console.error("⚠️ NEXT_PUBLIC_MOCK_USDC is not set in .env");
}

// ---- Helpers ----
async function getSigner() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

async function getContract(address, abi, useSigner = true) {
  const signerOrProvider = useSigner
    ? await getSigner()
    : new ethers.providers.Web3Provider(window.ethereum);
  return new ethers.Contract(address, abi, signerOrProvider);
}

// ---------------- Contract Functions ----------------

// ✅ Approve GreenCreditToken (ERC1155)
export async function approveGreenCredit() {
  try {
    const contract = await getContract(GREEN_CREDIT_ADDRESS, greenCreditAbi);
    const tx = await contract.setApprovalForAll(ORDERBOOK_ADDRESS, true);
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Approved GreenCreditToken:", receipt);
    return receipt;
  } catch (err) {
    console.error("approveGreenCredit error:", err);
    throw err;
  }
}

// ✅ Approve mUSDC (ERC20)
export async function approveMUSDC(amount) {
  const erc20Abi = [
    "function approve(address spender, uint256 amount) public returns (bool)",
  ];

  try {
    const contract = await getContract(MUSDC_ADDRESS, erc20Abi);
    const tx = await contract.approve(ORDERBOOK_ADDRESS, amount);
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Approved mUSDC:", receipt);
    return receipt;
  } catch (err) {
    console.error("approveMUSDC error:", err);
    throw err;
  }
}

// ✅ Legacy alias for backward compatibility
export const approvePYUSD = approveMUSDC;

// ✅ Check user's GreenCredit balance for a specific tokenId
export async function getGreenCreditBalance(tokenId) {
  try {
    const signer = await getSigner();
    const userAddress = await signer.getAddress();
    const contract = await getContract(
      GREEN_CREDIT_ADDRESS,
      greenCreditAbi,
      false
    );
    const balance = await contract.balanceOf(userAddress, tokenId);
    console.log(
      `💰 GreenCredit balance for tokenId ${tokenId}:`,
      balance.toString()
    );
    return balance;
  } catch (err) {
    console.error("getGreenCreditBalance error:", err);
    throw err;
  }
}

// ✅ Check if user has approved orderbook for GreenCredits
export async function isGreenCreditApproved() {
  try {
    const signer = await getSigner();
    const userAddress = await signer.getAddress();
    const contract = await getContract(
      GREEN_CREDIT_ADDRESS,
      greenCreditAbi,
      false
    );
    const approved = await contract.isApprovedForAll(
      userAddress,
      ORDERBOOK_ADDRESS
    );
    console.log(`🔐 GreenCredit approved for orderbook:`, approved);
    return approved;
  } catch (err) {
    console.error("isGreenCreditApproved error:", err);
    throw err;
  }
}

// ✅ Check if user's token is frozen
export async function isTokenFrozen(tokenId) {
  try {
    const signer = await getSigner();
    const userAddress = await signer.getAddress();
    const contract = await getContract(
      GREEN_CREDIT_ADDRESS,
      greenCreditAbi,
      false
    );
    const frozen = await contract.isUserTokenFrozen(userAddress, tokenId);
    console.log(`❄️ Token ${tokenId} frozen for user:`, frozen);
    return frozen;
  } catch (err) {
    console.error("isTokenFrozen error:", err);
    return null;
  }
}

// ✅ Place order with pre-flight checks for sell orders
export async function placeOrder(
  tokenId,
  isBuy,
  price,
  amount,
  expiration = 0,
  minAmountOut = 0,
  referrer = ethers.constants.AddressZero
) {
  try {
    const contract = await getContract(ORDERBOOK_ADDRESS, orderbookAbi);

    // Pre-flight checks for SELL orders
    if (!isBuy) {
      console.log("🔍 Pre-flight checks for sell order...");

      // Check if user's token is frozen
      const frozen = await isTokenFrozen(tokenId);
      if (frozen === true) {
        throw new Error(
          `Your tokenId ${tokenId} is frozen and cannot be transferred.`
        );
      }
      console.log(
        `✅ Token frozen check passed: ${
          frozen === false ? "not frozen" : "unknown"
        }`
      );

      // Check balance
      const balance = await getGreenCreditBalance(tokenId);
      const amountBN = ethers.BigNumber.from(amount);
      if (balance.lt(amountBN)) {
        throw new Error(
          `Insufficient GreenCredit balance. You have ${balance.toString()} but trying to sell ${amountBN.toString()} of tokenId ${tokenId}`
        );
      }
      console.log(
        `✅ Balance check passed: ${balance.toString()} >= ${amountBN.toString()}`
      );

      // Check approval
      const approved = await isGreenCreditApproved();
      if (!approved) {
        throw new Error(
          "GreenCredit not approved for orderbook. Please approve first."
        );
      }
      console.log("✅ Approval check passed");
    }

    console.log("⏳ Sending placeOrder transaction...");
    console.log("📋 Order params:", {
      tokenId,
      isBuy,
      price: price.toString(),
      amount: amount.toString(),
      expiration,
      minAmountOut,
      referrer,
    });

    // Simulate the transaction first to get better error messages
    try {
      console.log("🔍 Simulating transaction with callStatic...");
      await contract.callStatic.placeOrder(
        tokenId,
        isBuy,
        price,
        amount,
        expiration,
        minAmountOut,
        referrer
      );
      console.log("✅ Simulation passed");
    } catch (simErr) {
      console.error("❌ Simulation failed:", simErr);
      // Try to extract revert reason
      const reason =
        simErr?.reason ||
        simErr?.error?.message ||
        simErr?.message ||
        "Unknown error";
      throw new Error(`Transaction will fail: ${reason}`);
    }

    const tx = await contract.placeOrder(
      tokenId,
      isBuy,
      price,
      amount,
      expiration,
      minAmountOut,
      referrer
    );
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Order placed:", receipt);
    return receipt;
  } catch (err) {
    console.error("placeOrder error:", err);
    throw err;
  }
}

// ✅ Fill order
export async function fillOrder(orderId, fillAmount) {
  try {
    const contract = await getContract(ORDERBOOK_ADDRESS, orderbookAbi);
    console.log("⏳ Sending fillOrder transaction...");
    const tx = await contract.fillOrder(orderId, fillAmount);
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Order filled:", receipt);
    return receipt;
  } catch (err) {
    console.error("fillOrder error:", err);
    throw err;
  }
}

// ✅ Get order info by ID
export async function getOrder(orderId) {
  try {
    const contract = await getContract(ORDERBOOK_ADDRESS, orderbookAbi, false);
    const order = await contract.orders(orderId);
    console.log("Order info:", order);
    return order;
  } catch (err) {
    console.error("getOrder error:", err);
    throw err;
  }
}

// ✅ Check if order is active
export async function isOrderActive(orderId) {
  try {
    const contract = await getContract(ORDERBOOK_ADDRESS, orderbookAbi, false);
    const active = await contract.orderActive(orderId);
    console.log(`Order ${orderId} active?`, active);
    return active;
  } catch (err) {
    console.error("isOrderActive error:", err);
    throw err;
  }
}
