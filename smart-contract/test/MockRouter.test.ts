import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockRouter", function () {
  let owner: any, user: any;
  let mockUSDT: any, mockRouter: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();

    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouter.deploy(await mockUSDT.getAddress(), await mockUSDT.getAddress());
    await mockRouter.waitForDeployment();

    await mockUSDT.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should add and remove liquidity", async function () {
    const amount = ethers.parseEther("100");
    await mockUSDT.connect(user).approve(await mockRouter.getAddress(), ethers.MaxUint256);

    await expect(
      mockRouter.connect(user).addLiquidity(
        await mockUSDT.getAddress(),
        await mockUSDT.getAddress(),
        amount,
        amount,
        0,
        0,
        user.address,
        ethers.MaxUint256
      )
    ).to.emit(mockRouter, "LiquidityAdded");

    expect(await mockRouter.liquidity(user.address)).to.be.gt(0);

    await expect(
      mockRouter.connect(user).removeLiquidity(
        await mockUSDT.getAddress(),
        await mockUSDT.getAddress(),
        await mockRouter.liquidity(user.address),
        0,
        0,
        user.address,
        ethers.MaxUint256
      )
    ).to.emit(mockRouter, "LiquidityRemoved");
  });

  it("Should swap tokens", async function () {
    const amount = ethers.parseEther("100");
    await mockUSDT.connect(user).approve(await mockRouter.getAddress(), ethers.MaxUint256);

    await mockRouter.connect(user).addLiquidity(
      await mockUSDT.getAddress(),
      await mockUSDT.getAddress(),
      amount,
      amount,
      0,
      0,
      user.address,
      ethers.MaxUint256
    );

    const swapAmount = ethers.parseEther("10");
    await expect(
      mockRouter.connect(user).swapExactTokensForTokens(
        swapAmount,
        0,
        [await mockUSDT.getAddress(), await mockUSDT.getAddress()],
        user.address,
        ethers.MaxUint256
      )
    ).to.emit(mockRouter, "Swap");
  });
});


