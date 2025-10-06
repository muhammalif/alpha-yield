import { expect } from "chai";
import { ethers } from "hardhat";

describe("WrappedU2U", function () {
  let owner: any, user: any;
  let wrappedU2U: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const WrappedU2U = await ethers.getContractFactory("WrappedU2U");
    wrappedU2U = await WrappedU2U.deploy();
    await wrappedU2U.waitForDeployment();
  });

  it("Should wrap and unwrap U2U", async function () {
    const amount = ethers.parseEther("1");

    await expect(wrappedU2U.connect(user).deposit({ value: amount }))
      .to.emit(wrappedU2U, "Deposit")
      .withArgs(user.address, amount);

    expect(await wrappedU2U.balanceOf(user.address)).to.equal(amount);

    await expect(wrappedU2U.connect(user).withdraw(amount))
      .to.emit(wrappedU2U, "Withdrawal")
      .withArgs(user.address, amount);

    expect(await wrappedU2U.balanceOf(user.address)).to.equal(0);
  });
});


