// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for GreenXchange testing on Mantle Sepolia
 * @dev ERC20 with 6 decimals, public faucet, mintable, burnable, pausable
 * 
 * Features:
 * - 6 decimals (matches real USDC)
 * - Public faucet: 1,000 mUSDC per claim with 24-hour cooldown
 * - Owner can mint/burn/airdrop to friends for testing
 * - Pausable for emergency stops
 * - Initial supply of 100 million mUSDC to owner
 */
contract MockUSDC is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    
    // ═══════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════
    
    /// @notice Amount given per faucet claim (10,000mUSDC = 10,000 * 10^6)
    uint256 public faucetAmount = 10000 * 10**6;
    
    /// @notice Public faucet for demo users - get mUSDC every 2 minutes

    uint256 public faucetCooldown = 2 minutes;
    
    /// @notice Tracks last faucet claim time per user
    mapping(address => uint256) public lastFaucetClaim;
    
    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════
    
    event FaucetClaimed(address indexed user, uint256 amount, uint256 nextClaimTime);
    event FaucetConfigured(uint256 amount, uint256 cooldown);
    event AirdropSent(address indexed from, address indexed to, uint256 amount);
    event BatchAirdrop(address indexed from, uint256 totalAmount, uint256 recipientCount);
    
    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════
    
    constructor() 
        ERC20("Mock USD Coin", "mUSDC") 
        Ownable(msg.sender) 
    {
        // Mint 100 million mUSDC to deployer
        // 100,000,000 * 10^6 = 100,000,000,000,000
        _mint(msg.sender, 100_000_000 * 10**6);
    }
    
    // ═══════════════════════════════════════════════════════════
    // DECIMALS OVERRIDE
    // ═══════════════════════════════════════════════════════════
    
    /// @notice USDC uses 6 decimals (not 18)
    /// @return uint8 Number of decimals (6)
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    // ═══════════════════════════════════════════════════════════
    // PUBLIC FAUCET FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    
    /// @notice Public faucet for testnet users - get 1,000 mUSDC every 24 hours
    /// @dev Self-service faucet with cooldown to prevent abuse
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + faucetCooldown,
            "MockUSDC: Must wait 2 min  between claims"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        uint256 nextClaim = block.timestamp + faucetCooldown;
        
        _mint(msg.sender, faucetAmount);
        
        emit FaucetClaimed(msg.sender, faucetAmount, nextClaim);
    }
    
    /// @notice Check when a user can claim from faucet again
    /// @param user Address to check
    /// @return timestamp When user can claim (or current time if can claim now)
    /// @return canClaim Boolean indicating if user can claim right now
    /// @return waitTime Seconds remaining until next claim (0 if can claim now)
    function getFaucetInfo(address user) external view returns (
        uint256 timestamp,
        bool canClaim,
        uint256 waitTime
    ) {
        uint256 lastClaim = lastFaucetClaim[user];
        
        // Never claimed before
        if (lastClaim == 0) {
            return (block.timestamp, true, 0);
        }
        
        uint256 nextClaim = lastClaim + faucetCooldown;
        
        // Can claim now
        if (block.timestamp >= nextClaim) {
            return (block.timestamp, true, 0);
        }
        
        // Must wait
        uint256 remaining = nextClaim - block.timestamp;
        return (nextClaim, false, remaining);
    }
    
    /// @notice Owner can adjust faucet amount
    /// @param _amount New faucet amount (in 6 decimals)
    function setFaucetAmount(uint256 _amount) external onlyOwner {
        require(_amount > 0, "MockUSDC: Amount must be positive");
        faucetAmount = _amount;
        emit FaucetConfigured(faucetAmount, faucetCooldown);
    }
    
    /// @notice Owner can adjust faucet cooldown period
    /// @param _cooldown New cooldown in seconds
    function setFaucetCooldown(uint256 _cooldown) external onlyOwner {
        faucetCooldown = _cooldown;
        emit FaucetConfigured(faucetAmount, faucetCooldown);
    }
    
    // ═══════════════════════════════════════════════════════════
    // OWNER MINTING FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    
    /// @notice Owner mints tokens (for special cases)
    /// @param to Recipient address
    /// @param amount Amount to mint (in 6 decimals)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /// @notice Batch mint to multiple addresses
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts to mint (must match recipients length)
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "MockUSDC: Length mismatch");
        require(recipients.length > 0, "MockUSDC: Empty array");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // AIRDROP FUNCTIONS (Send to friends for testing)
    // ═══════════════════════════════════════════════════════════
    
    /// @notice Send mUSDC to a friend for testing (uses your balance)
    /// @dev Anyone can use this, but it transfers from YOUR balance
    /// @param to Friend's address
    /// @param amount Amount to send (in 6 decimals, e.g., 1000000000 = 1,000 mUSDC)
    function airdropToFriend(address to, uint256 amount) external {
        require(to != address(0), "MockUSDC: Cannot send to zero address");
        require(amount > 0, "MockUSDC: Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "MockUSDC: Insufficient balance");
        
        _transfer(msg.sender, to, amount);
        emit AirdropSent(msg.sender, to, amount);
    }
    
    /// @notice Send mUSDC to multiple friends at once (batch airdrop)
    /// @dev Convenient for distributing to your testing team
    /// @param recipients Array of friends' addresses
    /// @param amounts Array of amounts to send (must match recipients length)
    function batchAirdrop(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "MockUSDC: Length mismatch");
        require(recipients.length > 0, "MockUSDC: Empty array");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockUSDC: Invalid recipient");
            require(amounts[i] > 0, "MockUSDC: Invalid amount");
            
            totalAmount += amounts[i];
            _transfer(msg.sender, recipients[i], amounts[i]);
            emit AirdropSent(msg.sender, recipients[i], amounts[i]);
        }
        
        emit BatchAirdrop(msg.sender, totalAmount, recipients.length);
    }
    
    /// @notice Send equal amount to multiple friends (simplified batch airdrop)
    /// @dev Easier to use when sending same amount to everyone
    /// @param recipients Array of friends' addresses
    /// @param amountEach Amount to send to each person
    function batchAirdropEqual(
        address[] calldata recipients,
        uint256 amountEach
    ) external {
        require(recipients.length > 0, "MockUSDC: Empty array");
        require(amountEach > 0, "MockUSDC: Amount must be positive");
        
        uint256 totalAmount = amountEach * recipients.length;
        require(balanceOf(msg.sender) >= totalAmount, "MockUSDC: Insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockUSDC: Invalid recipient");
            _transfer(msg.sender, recipients[i], amountEach);
            emit AirdropSent(msg.sender, recipients[i], amountEach);
        }
        
        emit BatchAirdrop(msg.sender, totalAmount, recipients.length);
    }
    
    // ═══════════════════════════════════════════════════════════
    // PAUSE FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    
    /// @notice Pause all token transfers (emergency use only)
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpause token transfers
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ═══════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    
    /// @notice Get formatted balance (useful for frontend)
    /// @param account Address to check
    /// @return balance Balance in standard format (without decimals)
    function getBalanceFormatted(address account) external view returns (uint256) {
        return balanceOf(account) / 10**6;
    }
    
    /// @notice Check total supply in standard format
    /// @return supply Total supply without decimals
    function getTotalSupplyFormatted() external view returns (uint256) {
        return totalSupply() / 10**6;
    }
    
    // ═══════════════════════════════════════════════════════════
    // OVERRIDES (Required for multiple inheritance)
    // ═══════════════════════════════════════════════════════════
    
    /// @dev Override required by Solidity for ERC20 + ERC20Pausable
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}