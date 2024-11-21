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
  });

  it("save the addresses", async () => {});
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
});
