// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GreenXchangeV2Factory.sol";
import "./GreenXchangeV2Pair.sol";

contract GreenXchangeV2Router {
    GreenXchangeV2Factory public immutable factory;

    constructor(address _factory) {
        require(_factory != address(0), "INVALID_FACTORY");
        factory = GreenXchangeV2Factory(_factory);
    }

    // ------------------------------------------------------------
    // LIQUIDITY
    // ------------------------------------------------------------

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external returns (address pair) {
        require(amountA > 0 && amountB > 0, "ZERO_AMOUNT");

        pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = factory.createPair(tokenA, tokenB);
        }

        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);

        GreenXchangeV2Pair(pair).mint(msg.sender);
    }

    // ------------------------------------------------------------
    // SWAP
    // ------------------------------------------------------------

    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external {
        require(amountIn > 0, "ZERO_INPUT");

        address pair = factory.getPair(tokenIn, tokenOut);
        require(pair != address(0), "PAIR_NOT_FOUND");

        (uint112 reserve0, uint112 reserve1) =
            GreenXchangeV2Pair(pair).getReserves();

        (uint256 reserveIn, uint256 reserveOut) =
            tokenIn < tokenOut
                ? (reserve0, reserve1)
                : (reserve1, reserve0);

        // Uniswap V2 formula with 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        uint256 amountOut =
            (amountInWithFee * reserveOut) /
            (reserveIn * 1000 + amountInWithFee);

        require(amountOut >= minAmountOut, "SLIPPAGE_TOO_HIGH");

        IERC20(tokenIn).transferFrom(msg.sender, pair, amountIn);

        if (tokenIn < tokenOut) {
            GreenXchangeV2Pair(pair).swap(0, amountOut, msg.sender);
        } else {
            GreenXchangeV2Pair(pair).swap(amountOut, 0, msg.sender);
        }
    }
}
