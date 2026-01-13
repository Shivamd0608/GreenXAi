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

    // ✅ ADDED: Deadline modifier for MEV protection
    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "EXPIRED");
        _;
    }

    // ------------------------------------------------------------
    // LIQUIDITY
    // ------------------------------------------------------------

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline) // ✅ ADDED deadline protection
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        require(amountADesired > 0 && amountBDesired > 0, "ZERO_AMOUNT");

        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = factory.createPair(tokenA, tokenB);
        }

        // ✅ ADDED: Calculate optimal amounts
        (amountA, amountB) = _calculateOptimalAmounts(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );

        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);

        liquidity = GreenXchangeV2Pair(pair).mint(to);
    }

    // ✅ ADDED: Helper function for optimal liquidity calculation
    function _calculateOptimalAmounts(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) private view returns (uint256 amountA, uint256 amountB) {
        address pair = factory.getPair(tokenA, tokenB);
        
        if (pair == address(0)) {
            // New pair - use desired amounts
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            // Existing pair - calculate optimal amounts
            (uint112 reserveA, uint112 reserveB, ) = GreenXchangeV2Pair(pair).getReserves();
            
            // ✅ FIXED: Properly handle token ordering
            address token0 = address(GreenXchangeV2Pair(pair).token0());
            if (tokenA != token0) {
                (reserveA, reserveB) = (reserveB, reserveA);
            }

            if (reserveA == 0 && reserveB == 0) {
                (amountA, amountB) = (amountADesired, amountBDesired);
            } else {
                uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
                if (amountBOptimal <= amountBDesired) {
                    require(amountBOptimal >= amountBMin, "INSUFFICIENT_B_AMOUNT");
                    (amountA, amountB) = (amountADesired, amountBOptimal);
                } else {
                    uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                    require(amountAOptimal <= amountADesired, "INVALID_A_AMOUNT");
                    require(amountAOptimal >= amountAMin, "INSUFFICIENT_A_AMOUNT");
                    (amountA, amountB) = (amountAOptimal, amountBDesired);
                }
            }
        }
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline) // ✅ ADDED deadline protection
        returns (uint256 amountA, uint256 amountB)
    {
        address pair = factory.getPair(tokenA, tokenB);
        require(pair != address(0), "PAIR_NOT_FOUND");

        // Transfer LP tokens to pair
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);

        // Burn and receive tokens
        (uint256 amount0, uint256 amount1) = GreenXchangeV2Pair(pair).burn(to);

        // ✅ FIXED: Properly handle token ordering
        address token0 = address(GreenXchangeV2Pair(pair).token0());
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);

        require(amountA >= amountAMin, "INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "INSUFFICIENT_B_AMOUNT");
    }

    // ------------------------------------------------------------
    // SWAP
    // ------------------------------------------------------------

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline) // ✅ ADDED deadline protection
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "INVALID_PATH");
        require(amountIn > 0, "ZERO_INPUT");

        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "SLIPPAGE_TOO_HIGH");

        address pair = factory.getPair(path[0], path[1]);
        require(pair != address(0), "PAIR_NOT_FOUND");

        IERC20(path[0]).transferFrom(msg.sender, pair, amounts[0]);
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline) // ✅ ADDED deadline protection
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "INVALID_PATH");

        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "EXCESSIVE_INPUT_AMOUNT");

        address pair = factory.getPair(path[0], path[1]);
        require(pair != address(0), "PAIR_NOT_FOUND");

        IERC20(path[0]).transferFrom(msg.sender, pair, amounts[0]);
        _swap(amounts, path, to);
    }

    // ✅ FIXED: Internal swap function with proper token ordering
    function _swap(
        uint256[] memory amounts,
        address[] memory path,
        address _to
    ) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            address pair = factory.getPair(input, output);
            
            uint256 amountOut = amounts[i + 1];
            
            // ✅ FIXED: Properly determine token ordering
            address token0 = address(GreenXchangeV2Pair(pair).token0());
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));

            address to = i < path.length - 2
                ? factory.getPair(output, path[i + 2])
                : _to;

            GreenXchangeV2Pair(pair).swap(amount0Out, amount1Out, to);
        }
    }

    // ------------------------------------------------------------
    // QUOTE & AMOUNT HELPERS
    // ------------------------------------------------------------

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256 amountB) {
        require(amountA > 0, "INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountIn) {
        require(amountOut > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");

        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path)
        public
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            address pair = factory.getPair(path[i], path[i + 1]);
            require(pair != address(0), "PAIR_NOT_FOUND");

            (uint112 reserve0, uint112 reserve1, ) = GreenXchangeV2Pair(pair).getReserves();
            
            // ✅ FIXED: Properly handle token ordering
            address token0 = address(GreenXchangeV2Pair(pair).token0());
            (uint256 reserveIn, uint256 reserveOut) = path[i] == token0
                ? (uint256(reserve0), uint256(reserve1))
                : (uint256(reserve1), uint256(reserve0));

            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(uint256 amountOut, address[] memory path)
        public
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;

        for (uint256 i = path.length - 1; i > 0; i--) {
            address pair = factory.getPair(path[i - 1], path[i]);
            require(pair != address(0), "PAIR_NOT_FOUND");

            (uint112 reserve0, uint112 reserve1, ) = GreenXchangeV2Pair(pair).getReserves();
            
            // ✅ FIXED: Properly handle token ordering
            address token0 = address(GreenXchangeV2Pair(pair).token0());
            (uint256 reserveIn, uint256 reserveOut) = path[i - 1] == token0
                ? (uint256(reserve0), uint256(reserve1))
                : (uint256(reserve1), uint256(reserve0));

            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}