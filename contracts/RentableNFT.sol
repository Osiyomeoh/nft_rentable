// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RentableNFT is ERC721, Ownable {
    struct Rental {
        address renter;
        uint256 expiresAt;
        uint256 price;
        bool active;
    }
    
    // Mapping from token ID to rental details
    mapping(uint256 => Rental) public rentals;
    
    // Events
    event NFTListed(uint256 indexed tokenId, uint256 price, uint256 duration);
    event NFTRented(uint256 indexed tokenId, address indexed renter, uint256 expiresAt);
    event RentalEnded(uint256 indexed tokenId, address indexed renter);
    
    constructor() ERC721("RentableNFT", "RNFT") Ownable(msg.sender) {}
    
    // Mint new NFT (only owner)
    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }
    
    // List NFT for rent
    function listForRent(
        uint256 tokenId, 
        uint256 price
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!rentals[tokenId].active, "Already listed or rented");
        
        rentals[tokenId] = Rental({
            renter: address(0),
            expiresAt: 0,
            price: price,
            active: true
        });
        
        emit NFTListed(tokenId, price, 0);
    }
    
    // Rent an NFT
    function rentNFT(uint256 tokenId, uint256 duration) external payable {
        Rental storage rental = rentals[tokenId];
        require(rental.active, "Not available for rent");
        require(msg.value >= rental.price * duration, "Insufficient payment");
        require(rental.renter == address(0), "Already rented");
        
        rental.renter = msg.sender;
        rental.expiresAt = block.timestamp + duration;
        
        // Transfer rent payment to NFT owner
        payable(ownerOf(tokenId)).transfer(msg.value);
        
        emit NFTRented(tokenId, msg.sender, rental.expiresAt);
    }
    
    // End rental (can be called by owner or renter)
    function endRental(uint256 tokenId) external {
        Rental storage rental = rentals[tokenId];
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == rental.renter,
            "Not authorized"
        );
        require(rental.active && rental.renter != address(0), "Not rented");
        require(block.timestamp >= rental.expiresAt, "Rental period not expired");
        
        address renter = rental.renter;
        rental.renter = address(0);
        rental.expiresAt = 0;
        rental.active = false;
        
        emit RentalEnded(tokenId, renter);
    }
    
    // Check if an NFT is currently rented
    function isRented(uint256 tokenId) public view returns (bool) {
        Rental memory rental = rentals[tokenId];
        return rental.active && 
               rental.renter != address(0) && 
               block.timestamp < rental.expiresAt;
    }
    
    // Override _update to prevent transfer of rented NFTs
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        require(!isRented(tokenId), "Cannot transfer while rented");
        return super._update(to, tokenId, auth);
    }
    
    // Get current renter of an NFT
    function getCurrentRenter(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        if (isRented(tokenId)) {
            return rentals[tokenId].renter;
        }
        return address(0);
    }
}