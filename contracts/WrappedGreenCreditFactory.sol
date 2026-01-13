// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./WrappedGreenCredit.sol";

contract WrappedGreenCreditFactory {
    /// @notice ERC1155 => tokenId => wrapper
    mapping(address => mapping(uint256 => address)) public wrapperOf;

    /// @notice list of all wrappers (optional but useful)
    address[] public allWrappers;

    event WrapperCreated(
        address indexed greenCredit,
        uint256 indexed tokenId,
        address wrapper,
        string name,
        string symbol
    );

    /**
     * @notice Deploy ERC20 wrapper for a Green Credit (ERC1155 tokenId)
     * @param greenCredit ERC1155 GreenCreditToken address
     * @param tokenId ERC1155 tokenId (credit ID)
     * @param name ERC20 name (project name / credit name)
     * @param symbol ERC20 symbol
     */
    function createWrapper(
        address greenCredit,
        uint256 tokenId,
        string calldata name,
        string calldata symbol
    ) external returns (address wrapper) {
        require(greenCredit != address(0), "invalid greenCredit");
        require(
            wrapperOf[greenCredit][tokenId] == address(0),
            "wrapper already exists"
        );

        wrapper = address(
            new WrappedGreenCredit(
                greenCredit,
                tokenId,
                name,
                symbol
            )
        );

        wrapperOf[greenCredit][tokenId] = wrapper;
        allWrappers.push(wrapper);

        emit WrapperCreated(
            greenCredit,
            tokenId,
            wrapper,
            name,
            symbol
        );
    }

    /// @notice frontend helper
    function totalWrappers() external view returns (uint256) {
        return allWrappers.length;
    }
}
