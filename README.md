# Rentable NFT Smart Contract

A Solidity smart contract that enables NFT rentals with time-based access control. This contract allows NFT owners to rent out their tokens for specified periods while maintaining ownership.

## Features

- 🎨 ERC721-based NFT implementation
- 📅 Time-based rental system
- 💰 Customizable rental pricing
- 🔒 Transfer restrictions during rental periods
- ⏰ Automatic rental expiration
- ✅ Owner and renter access control

## Technology Stack

- Solidity ^0.8.20
- Hardhat Development Environment
- OpenZeppelin Contracts
- TypeScript/JavaScript Testing Suite
- Ethers.js

## Contract Structure

The main contract `RentableNFT.sol` implements the following key features:

```solidity
struct Rental {
    address renter;
    uint256 expiresAt;
    uint256 price;
    bool active;
}
```

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rentable-nft
```

2. Install dependencies
```bash
npm install
```

3. Compile contracts
```bash
npx hardhat compile
```

4. Run tests
```bash
npx hardhat test
```

## Usage

### Deployment

Deploy to local hardhat network:
```bash
npx hardhat run scripts/deploy.ts
```

Deploy to a specific network:
```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

### Contract Interaction

1. **Mint NFT** (Owner only)
```javascript
await rentableNFT.mint(ownerAddress, tokenId);
```

2. **List NFT for Rent**
```javascript
await rentableNFT.listForRent(tokenId, pricePerDay);
```

3. **Rent NFT**
```javascript
await rentableNFT.rentNFT(tokenId, durationInSeconds, {
    value: pricePerDay * durationInSeconds
});
```

4. **End Rental** (After expiration)
```javascript
await rentableNFT.endRental(tokenId);
```

## Core Functions

### For NFT Owners

- `mint(address to, uint256 tokenId)`: Create new NFT
- `listForRent(uint256 tokenId, uint256 price)`: List NFT for rental
- `endRental(uint256 tokenId)`: End an expired rental

### For Renters

- `rentNFT(uint256 tokenId, uint256 duration)`: Rent an NFT
- `endRental(uint256 tokenId)`: End an expired rental

### View Functions

- `isRented(uint256 tokenId)`: Check if NFT is currently rented
- `getCurrentRenter(uint256 tokenId)`: Get the current renter's address

## Testing

The project includes a comprehensive test suite covering:

- Deployment validation
- NFT minting
- Rental listings
- Rental operations
- Access control
- Time-based functionalities

Run the test suite:
```bash
npx hardhat test
```

## Security

The contract implements several security measures:

- Ownership validation
- Rental period enforcement
- Transfer restrictions during rental
- Payment validation
- Time-based access control

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- OpenZeppelin for secure contract implementations
- Hardhat for the development environment
- Ethereum community for best practices and standards
