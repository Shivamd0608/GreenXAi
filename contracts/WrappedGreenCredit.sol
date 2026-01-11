// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IGreenCreditToken is IERC1155 {
    function isFrozen(uint256 tokenId) external view returns (bool);
    function isRetired(uint256 tokenId) external view returns (bool);
}

contract WrappedGreenCredit is ERC20, ERC20Burnable, ReentrancyGuard {
    /// @notice ERC-1155 Green Credit contract
    IGreenCreditToken public immutable greenCredit;

    /// @notice ERC-1155 tokenId this wrapper represents
    uint256 public immutable tokenId;

    event Wrapped(address indexed user, uint256 amount);
    event Unwrapped(address indexed user, uint256 amount);

    constructor(
        address _greenCredit,
        uint256 _tokenId,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        require(_greenCredit != address(0), "Invalid credit contract");

        greenCredit = IGreenCreditToken(_greenCredit);
        tokenId = _tokenId;
    }

    /// @notice Wrap ERC-1155 credits into ERC-20
    function wrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");

        // Compliance checks
        require(!greenCredit.isFrozen(tokenId), "Credit frozen");
        require(!greenCredit.isRetired(tokenId), "Credit retired");

        // Transfer ERC-1155 to this contract
        greenCredit.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );

        // Mint ERC-20 (1 credit = 1e18)
        _mint(msg.sender, amount * 1e18);

        emit Wrapped(msg.sender, amount);
    }

    /// @notice Unwrap ERC-20 back into ERC-1155
    function unwrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(amount % 1e18 == 0, "Invalid amount");

        uint256 creditAmount = amount / 1e18;

        _burn(msg.sender, amount);

        greenCredit.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            creditAmount,
            ""
        );

        emit Unwrapped(msg.sender, creditAmount);
    }

    /// @dev Required to receive ERC-1155 tokens
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
