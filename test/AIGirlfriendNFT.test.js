const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIGirlfriendNFT", function () {
  let AIGirlfriendNFT;
  let aiGirlfriendNFT;
  let owner;
  let addr1;
  let addr2;

  const MINT_PRICE = ethers.parseEther("0.01");
  const CHAT_PRICE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    AIGirlfriendNFT = await ethers.getContractFactory("AIGirlfriendNFT");
    aiGirlfriendNFT = await AIGirlfriendNFT.deploy(owner.address);
    await aiGirlfriendNFT.waitForDeployment();
  });

  describe("Minting", function () {
    it("Should mint an AI girlfriend NFT with correct payment", async function () {
      const tx = await aiGirlfriendNFT.connect(addr1).mintGirlfriend(
        "Alice",
        "Sweet and caring",
        "QmImageHash123",
        "QmPersonalityHash123",
        true,
        { value: MINT_PRICE }
      );

      await expect(tx)
        .to.emit(aiGirlfriendNFT, "AIGirlfriendMinted")
        .withArgs(1, addr1.address, "Alice", "Sweet and caring", "QmImageHash123", "QmPersonalityHash123");

      expect(await aiGirlfriendNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should fail to mint with insufficient payment", async function () {
      await expect(
        aiGirlfriendNFT.connect(addr1).mintGirlfriend(
          "Alice",
          "Sweet and caring",
          "QmImageHash123",
          "QmPersonalityHash123",
          true,
          { value: ethers.parseEther("0.005") }
        )
      ).to.be.revertedWith("Insufficient payment for minting");
    });

    it("Should fail to mint with empty name", async function () {
      await expect(
        aiGirlfriendNFT.connect(addr1).mintGirlfriend(
          "",
          "Sweet and caring",
          "QmImageHash123",
          "QmPersonalityHash123",
          true,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Chat Sessions", function () {
    beforeEach(async function () {
      await aiGirlfriendNFT.connect(addr1).mintGirlfriend(
        "Alice",
        "Sweet and caring",
        "QmImageHash123",
        "QmPersonalityHash123",
        true,
        { value: MINT_PRICE }
      );
    });

    it("Should allow owner to chat for free", async function () {
      const balanceBefore = await ethers.provider.getBalance(addr1.address);

      const tx = await aiGirlfriendNFT.connect(addr1).startChatSession(1, {
        value: CHAT_PRICE,
        gasPrice: ethers.parseUnits("20", "gwei")
      });

      const balanceAfter = await ethers.provider.getBalance(addr1.address);
      const gasUsed = (await tx.wait()).gasUsed * ethers.parseUnits("20", "gwei");

      // Owner should only pay gas, chat payment should be refunded
      expect(balanceBefore - balanceAfter).to.be.closeTo(gasUsed, ethers.parseEther("0.001"));
    });

    it("Should allow others to pay for chat with public girlfriend", async function () {
      const ownerBalanceBefore = await ethers.provider.getBalance(addr1.address);

      await expect(
        aiGirlfriendNFT.connect(addr2).startChatSession(1, { value: CHAT_PRICE })
      ).to.emit(aiGirlfriendNFT, "ChatSessionStarted")
        .withArgs(1, addr2.address, 1);

      const ownerBalanceAfter = await ethers.provider.getBalance(addr1.address);
      const expectedOwnerShare = (CHAT_PRICE * BigInt(90)) / BigInt(100);

      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedOwnerShare);
    });

    it("Should fail to chat with private girlfriend", async function () {
      // Mint a private girlfriend
      await aiGirlfriendNFT.connect(addr1).mintGirlfriend(
        "Private Alice",
        "Private personality",
        "QmImageHash456",
        "QmPersonalityHash456",
        false,
        { value: MINT_PRICE }
      );

      await expect(
        aiGirlfriendNFT.connect(addr2).startChatSession(2, { value: CHAT_PRICE })
      ).to.be.revertedWith("This AI girlfriend is private");
    });
  });

  describe("Getters", function () {
    beforeEach(async function () {
      await aiGirlfriendNFT.connect(addr1).mintGirlfriend(
        "Alice",
        "Sweet and caring",
        "QmImageHash123",
        "QmPersonalityHash123",
        true,
        { value: MINT_PRICE }
      );
    });

    it("Should return all public girlfriends", async function () {
      const publicGirlfriends = await aiGirlfriendNFT.getAllPublicGirlfriends();
      expect(publicGirlfriends.length).to.equal(1);
      expect(publicGirlfriends[0]).to.equal(1);
    });

    it("Should return user created girlfriends", async function () {
      const userGirlfriends = await aiGirlfriendNFT.getUserCreatedGirlfriends(addr1.address);
      expect(userGirlfriends.length).to.equal(1);
      expect(userGirlfriends[0]).to.equal(1);
    });

    it("Should return girlfriend details", async function () {
      const girlfriend = await aiGirlfriendNFT.getGirlfriendDetails(1);
      expect(girlfriend.name).to.equal("Alice");
      expect(girlfriend.personality).to.equal("Sweet and caring");
      expect(girlfriend.creator).to.equal(addr1.address);
      expect(girlfriend.isPublic).to.equal(true);
    });
  });
});