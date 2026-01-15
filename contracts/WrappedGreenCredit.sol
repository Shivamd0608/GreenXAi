// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/// @notice Interface MATCHING your GreenCreditToken exactly
interface IGreenCreditToken is IERC1155 {
    // Define the struct as it exists in GreenCreditToken
    struct CreditInfo {
        uint8 creditType;  // enum is stored as uint8
        string projectTitle;
        string location;
        string certificateHash;
        address registrar;  // ← ADDED: was missing, causing ABI mismatch
        bool exists;
        bool revoked;
    }
    
    function isUserTokenFrozen(address user, uint256 tokenId)
        external
        view
        returns (bool);
    
    // This returns a STRUCT, not individual values
    function getCreditInfo(uint256 tokenId)
        external
        view
        returns (CreditInfo memory);
}

contract WrappedGreenCredit is
    ERC20,
    ERC20Burnable,
    ReentrancyGuard,
    IERC1155Receiver
{
    IGreenCreditToken public immutable greenCredit;
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

    // --------------------------------------------------
    // ERC1155 RECEIVER
    // --------------------------------------------------
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        returns (bool)
    {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }

    // --------------------------------------------------
    // WRAP : ERC1155 -> ERC20
    // --------------------------------------------------
    function wrap(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        
        // user-level freeze check
        require(
            !greenCredit.isUserTokenFrozen(msg.sender, tokenId),
            "Frozen"
        );
        
        // credit-level revoke check - FIXED: now using struct
        IGreenCreditToken.CreditInfo memory info = greenCredit.getCreditInfo(tokenId);
        require(!info.revoked, "Revoked");
        require(info.exists, "Credit doesn't exist");
        
        // move ERC1155 into wrapper
        greenCredit.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );
        
        // mint ERC20 (1 credit = 1e18)
        _mint(msg.sender, amount * 1e18);
        
        emit Wrapped(msg.sender, amount);
    }

    // --------------------------------------------------
    // UNWRAP : ERC20 -> ERC1155
    // --------------------------------------------------
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
}