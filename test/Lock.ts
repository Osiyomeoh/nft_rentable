import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("RentableNFT", function () {
  async function deployRentableNFTFixture() {
    const ONE_DAY_IN_SECS = 24 * 60 * 60;
    const ONE_ETH = hre.ethers.parseEther("1");
    const RENT_PRICE = hre.ethers.parseEther("0.1"); // 0.1 ETH per day
    
    const [owner, renter, otherAccount] = await hre.ethers.getSigners();
    
    const RentableNFT = await hre.ethers.getContractFactory("RentableNFT");
    const rentableNFT = await RentableNFT.deploy();
    
    // Mint a token for testing
    await rentableNFT.mint(owner.address, 1);
    
    return { 
      rentableNFT, 
      owner, 
      renter, 
      otherAccount, 
      ONE_DAY_IN_SECS, 
      ONE_ETH,
      RENT_PRICE 
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { rentableNFT, owner } = await loadFixture(deployRentableNFTFixture);
      expect(await rentableNFT.owner()).to.equal(owner.address);
    });

    it("Should mint NFT correctly", async function () {
      const { rentableNFT, owner } = await loadFixture(deployRentableNFTFixture);
      expect(await rentableNFT.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe("Listing", function () {
    it("Should allow owner to list NFT for rent", async function () {
      const { rentableNFT, RENT_PRICE } = await loadFixture(deployRentableNFTFixture);
      
      await expect(rentableNFT.listForRent(1, RENT_PRICE))
        .to.emit(rentableNFT, "NFTListed")
        .withArgs(1, RENT_PRICE, 0);
    });

    it("Should not allow non-owner to list NFT", async function () {
      const { rentableNFT, renter, RENT_PRICE } = await loadFixture(deployRentableNFTFixture);
      
      await expect(
        rentableNFT.connect(renter).listForRent(1, RENT_PRICE)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should not allow listing already listed NFT", async function () {
      const { rentableNFT, RENT_PRICE } = await loadFixture(deployRentableNFTFixture);
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      await expect(
        rentableNFT.listForRent(1, RENT_PRICE)
      ).to.be.revertedWith("Already listed or rented");
    });
  });

  describe("Renting", function () {
    it("Should allow renting an NFT", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await expect(
        rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount })
      )
        .to.emit(rentableNFT, "NFTRented")
        .withArgs(1, renter.address, anyValue);
    });

    it("Should not allow renting unlisted NFT", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await expect(
        rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount })
      ).to.be.revertedWith("Not available for rent");
    });

    it("Should not allow renting with insufficient payment", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      const insufficientPayment = paymentAmount / 2n;
      
      await expect(
        rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Rental Status", function () {
    it("Should correctly track rental status", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount });
      
      expect(await rentableNFT.isRented(1)).to.be.true;
      expect(await rentableNFT.getCurrentRenter(1)).to.equal(renter.address);
    });

    it("Should prevent transfer of rented NFT", async function () {
      const { rentableNFT, owner, renter, otherAccount, RENT_PRICE, ONE_DAY_IN_SECS } = 
        await loadFixture(deployRentableNFTFixture);
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount });
      
      await expect(
        rentableNFT.transferFrom(owner.address, otherAccount.address, 1)
      ).to.be.revertedWith("Cannot transfer while rented");
    });
  });

  describe("End Rental", function () {
    it("Should allow ending rental after expiration", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount });
      
      await time.increase(ONE_DAY_IN_SECS + 1);
      
      await expect(rentableNFT.endRental(1))
        .to.emit(rentableNFT, "RentalEnded")
        .withArgs(1, renter.address);
    });

    it("Should not allow ending rental before expiration", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount });
      
      await expect(rentableNFT.endRental(1))
        .to.be.revertedWith("Rental period not expired");
    });

    it("Should allow both owner and renter to end rental", async function () {
      const { rentableNFT, renter, RENT_PRICE, ONE_DAY_IN_SECS } = await loadFixture(
        deployRentableNFTFixture
      );
      
      await rentableNFT.listForRent(1, RENT_PRICE);
      const paymentAmount = RENT_PRICE * BigInt(ONE_DAY_IN_SECS);
      
      await rentableNFT.connect(renter).rentNFT(1, ONE_DAY_IN_SECS, { value: paymentAmount });
      
      await time.increase(ONE_DAY_IN_SECS + 1);
      
      await expect(rentableNFT.connect(renter).endRental(1)).not.to.be.reverted;
    });
  });
});