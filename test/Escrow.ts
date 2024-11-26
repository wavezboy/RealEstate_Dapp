import { ethers } from "hardhat";
import { expect } from "chai";
import { RealEstate } from "../typechain-types";

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let escrow;

  let realEstate: RealEstate;
  let buyer, seller, inspector, lender;
  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // deply real estate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // mint
    let transaction = await realEstate
      .connect(seller)
      .mint("http://localhost:3000/property");
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    );

    // apprived property
    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    // list property
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
  });

  // it("save the addresses", async () => {});

  describe("Deployment", () => {
    it("Return NFT address", async () => {
      const result = await escrow!.nftAddress();
      expect(result).to.be.equal(realEstate.address);
    });
    it("Return seller address", async () => {
      const result = await escrow!.seller();
      expect(result).to.be.equal(seller.address);
    });
    it("Return inspector address", async () => {
      const result = await escrow!.inspector();
      expect(result).to.be.equal(inspector.address);
    });
    it("Return lender address", async () => {
      const result = await escrow!.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Update as Listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });

    it("Update Ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });

    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });
    it("Returns Purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    });
    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    });

    it("Log Ownership", async () => {
      console.log(
        `realEstateOwner: ${await realEstate.ownerOf(1)} & escrowAddress: ${
          escrow.address
        }`
      );
    });
  });

  describe("Deposits", () => {
    it("updates contract balance", async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });

      await transaction.wait();

      const result = await escrow.getBalance();
      expect(result).to.be.equal(tokens(5));

      console.log(`deposit: ${await escrow.getBalance()}`);
    });
  });

  describe("inspection", () => {
    it("updates inspection status", async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);

      await transaction.wait();

      const result = await escrow.inspectionPassed(1);

      expect(result).to.be.equal(true);
    });
  });

  describe("approval", () => {
    it("update approval", async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("sale", async () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({ to: escrow.address, value: tokens(5) });

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    it("update balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });

    it("update ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
    });
  });
});
