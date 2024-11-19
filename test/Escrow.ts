import { ethers } from "hardhat";
import { expect } from "chai";

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  it("save the addresses", async () => {
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

    let result = await escrow!.nftAddress();
    expect(result).to.be.equal(realEstate.address);

    result = await escrow!.seller();
    expect(result).to.be.equal(seller.address);

    result = await escrow!.inspector();
    expect(result).to.be.equal(inspector.address);

    result = await escrow!.lender();
    expect(result).to.be.equal(lender.address);
  });
});
