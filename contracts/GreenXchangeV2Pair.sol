// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GreenXchangeV2Pair is ERC20, ReentrancyGuard {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint112 private reserve0;
    uint112 private reserve1;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out
    );

    constructor(address _token0, address _token1)
        ERC20("GreenX LP Token", "GX-LP")
    {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function getReserves() public view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }

    function _update(uint256 balance0, uint256 balance1) private {
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
    }

    // ---------- LIQUIDITY ----------

    function mint(address to) external nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1) = getReserves();

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        if (totalSupply() == 0) {
            liquidity = _sqrt(amount0 * amount1);
        } else {
            liquidity = _min(
                (amount0 * totalSupply()) / _reserve0,
                (amount1 * totalSupply()) / _reserve1
            );
        }

        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");

        _mint(to, liquidity);
        _update(balance0, balance1);

        emit Mint(msg.sender, amount0, amount1);
    }

    function burn(address to)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        (uint112 _reserve0, uint112 _reserve1) = getReserves();

        uint256 liquidity = balanceOf(address(this));
        uint256 _totalSupply = totalSupply();

        amount0 = (liquidity * _reserve0) / _totalSupply;
        amount1 = (liquidity * _reserve1) / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_LIQUIDITY_BURNED");

        _burn(address(this), liquidity);

        token0.transfer(to, amount0);
        token1.transfer(to, amount1);

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        _update(balance0, balance1);

        emit Burn(msg.sender, amount0, amount1);
    }

    // ---------- SWAP ----------

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to
    ) external nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT");

        (uint112 _reserve0, uint112 _reserve1) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "INSUFFICIENT_LIQUIDITY");

        if (amount0Out > 0) token0.transfer(to, amount0Out);
        if (amount1Out > 0) token1.transfer(to, amount1Out);

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        uint256 amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;

        require(amount0In > 0 || amount1In > 0, "INSUFFICIENT_INPUT");

        // 0.3% fee
        uint256 balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
        uint256 balance1Adjusted = (balance1 * 1000) - (amount1In * 3);

        require(
            balance0Adjusted * balance1Adjusted >=
                uint256(_reserve0) * uint256(_reserve1) * 1000**2,
            "K"
        );

        _update(balance0, balance1);

        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out);
    }

    // ---------- HELPERS ----------

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x < y ? x : y;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
