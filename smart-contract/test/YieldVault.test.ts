import { expect } from "chai";
import { ethers } from "hardhat";

describe("YieldVault", function () {
  let owner: any, user1: any, user2: any;
  let mockUSDT: any, mockRouter: any, strategy: any, vault: any;
  const toEth = (v: string) => ethers.parseEther(v);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();

    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouter.deploy(await mockUSDT.getAddress(), await mockUSDT.getAddress());
    await mockRouter.waitForDeployment();

    const YieldVault = await ethers.getContractFactory("YieldVault");
    vault = await YieldVault.deploy(await mockUSDT.getAddress(), ethers.ZeroAddress);
    await vault.waitForDeployment();

    const SimpleStrategy = await ethers.getContractFactory("SimpleStrategy");
    strategy = await SimpleStrategy.deploy(
      await mockUSDT.getAddress(),
      await mockUSDT.getAddress(),
      await mockRouter.getAddress(),
      await vault.getAddress()
    );
    await strategy.waitForDeployment();
    await vault.setStrategy(await strategy.getAddress());

    await mockUSDT.transfer(user1.address, toEth("1000"));
    await mockUSDT.transfer(user2.address, toEth("1000"));

    await mockUSDT.approve(await strategy.getAddress(), toEth("100000"));
    await strategy.fundPairToken(toEth("100000"));
  });

  it("Should deploy correctly", async function () {
    expect(await vault.token()).to.equal(await mockUSDT.getAddress());
    expect(await vault.strategyRouter()).to.equal(await strategy.getAddress());
  });

  it("Should allow deposit", async function () {
    const amount = toEth("100");
    await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
    await expect(vault.connect(user1).deposit(amount))
      .to.emit(vault, "Deposited")
      .withArgs(user1.address, amount);

    expect(await vault.balances(user1.address)).to.equal(amount);
    expect(await vault.totalAssets()).to.equal(amount);
  });

  it("Should allow withdraw", async function () {
    const amount = toEth("100");
    await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
    await vault.connect(user1).deposit(amount);

    await expect(vault.connect(user1).withdraw(amount))
      .to.emit(vault, "Withdrawn")
      .withArgs(user1.address, amount);

    expect(await vault.balances(user1.address)).to.equal(0);
    expect(await vault.totalAssets()).to.equal(0);
  });

  it("Should claim rewards", async function () {
    const amount = toEth("100");
    await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
    await vault.connect(user1).deposit(amount);

    await strategy.harvest();

    const initialBalance = await mockUSDT.balanceOf(user1.address);
    await vault.connect(user1).claimRewards();
    const finalBalance = await mockUSDT.balanceOf(user1.address);

    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("Should respect strategy pause (deposit reverts)", async function () {
    await strategy.pause();
    const amount = toEth("100");
    await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
    await expect(vault.connect(user1).deposit(amount)).to.be.revertedWith("SimpleStrategy: paused");

    await strategy.unpause();
    await expect(vault.connect(user1).deposit(amount)).to.emit(vault, "Deposited");
  });

  it("Should reject invalid deposits", async function () {
    await expect(vault.connect(user1).deposit(0n)).to.be.revertedWith("YieldVault: deposit amount must be greater than zero");
  });
});


