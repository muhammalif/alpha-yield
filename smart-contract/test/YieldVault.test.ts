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

   it("Should claim rewards accurately for single user", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await vault.connect(user1).deposit(amount);

     await strategy.harvest();

     const initialBalance = await mockUSDT.balanceOf(user1.address);
     await vault.connect(user1).claimRewards();
     const finalBalance = await mockUSDT.balanceOf(user1.address);

     expect(finalBalance).to.be.gt(initialBalance);
   });

   it("Should claim rewards proportionally for multiple users", async function () {
     const amount1 = toEth("1000");
     const amount2 = toEth("50"); // <10% of totalAssets after first deposit
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount1);
     await mockUSDT.connect(user2).approve(await vault.getAddress(), amount2);
     await vault.connect(user1).deposit(amount1);
     await vault.connect(user2).deposit(amount2);

     // Harvest to add rewards
     await strategy.harvest();

     const balance1Before = await mockUSDT.balanceOf(user1.address);
     const balance2Before = await mockUSDT.balanceOf(user2.address);

     await vault.connect(user1).claimRewards();
     await vault.connect(user2).claimRewards();

     const balance1After = await mockUSDT.balanceOf(user1.address);
     const balance2After = await mockUSDT.balanceOf(user2.address);

     const reward1 = balance1After - balance1Before;
     const reward2 = balance2After - balance2Before;

     // User1 deposited 1000, user2 50, so user1 should get more rewards
     expect(reward1).to.be.gt(reward2);
   });

   it("Should respect vault pause (deposit reverts)", async function () {
     await vault.pause();
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await expect(vault.connect(user1).deposit(amount)).to.be.revertedWith("YieldVault: paused");

     await vault.unpause();
     await expect(vault.connect(user1).deposit(amount)).to.emit(vault, "Deposited");
   });

   it("Should respect vault pause (withdraw reverts)", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await vault.connect(user1).deposit(amount);

     await vault.pause();
     await expect(vault.connect(user1).withdraw(amount)).to.be.revertedWith("YieldVault: paused");

     await vault.unpause();
     await expect(vault.connect(user1).withdraw(amount)).to.emit(vault, "Withdrawn");
   });

   it("Should reject invalid deposits", async function () {
     await expect(vault.connect(user1).deposit(0n)).to.be.revertedWith("YieldVault: deposit amount must be greater than zero");
   });

   it("Should enforce deposit rate limit", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await vault.connect(user1).deposit(amount); // First deposit OK

     const largeAmount = toEth("200"); // >10% of totalAssets (100)
     await mockUSDT.connect(user2).approve(await vault.getAddress(), largeAmount);
     await expect(vault.connect(user2).deposit(largeAmount)).to.be.revertedWith("YieldVault: deposit amount exceeds rate limit");
   });

   it("Should allow emergency withdraw by owner", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await vault.connect(user1).deposit(amount);

     await vault.emergencyWithdraw(); // Should not revert
     expect(await strategy.getStrategyBalance()).to.equal(0);
   });

   // Edge Cases
   it("Should reject zero deposit", async function () {
     await expect(vault.connect(user1).deposit(0n)).to.be.revertedWith("YieldVault: deposit amount must be greater than zero");
   });

   it("Should reject zero withdraw", async function () {
     await expect(vault.connect(user1).withdraw(0n)).to.be.revertedWith("YieldVault: withdraw amount must be greater than zero");
   });

   it("Should reject deposit without approval", async function () {
     const amount = toEth("100");
     await expect(vault.connect(user1).deposit(amount)).to.be.reverted; // ERC20 revert
   });

   it("Should reject withdraw exceeding balance", async function () {
     const depositAmount = toEth("100");
     const withdrawAmount = toEth("200");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), depositAmount);
     await vault.connect(user1).deposit(depositAmount);

     await expect(vault.connect(user1).withdraw(withdrawAmount)).to.be.revertedWith("YieldVault: insufficient balance");
   });

   it("Should reject claim without balance", async function () {
     await expect(vault.connect(user1).claimRewards()).to.be.revertedWith("YieldVault: no balance to claim rewards");
   });

   it("Should handle deposit when totalAssets is zero (first deposit)", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await expect(vault.connect(user1).deposit(amount)).to.emit(vault, "Deposited");
   });

   // Error Handling & Reverts
   it("Should reject deposit when paused", async function () {
     await vault.pause();
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await expect(vault.connect(user1).deposit(amount)).to.be.revertedWith("YieldVault: paused");
     await vault.unpause();
   });

   it("Should reject withdraw when paused", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await vault.connect(user1).deposit(amount);

     await vault.pause();
     await expect(vault.connect(user1).withdraw(amount)).to.be.revertedWith("YieldVault: paused");
     await vault.unpause();
   });

   it("Should reject emergency withdraw by non-owner", async function () {
     await expect(vault.connect(user1).emergencyWithdraw()).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
   });

   it("Should reject setStrategy by non-owner", async function () {
     await expect(vault.connect(user1).setStrategy(await strategy.getAddress())).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
   });

   // AI & Strategy Integration
   it("Should handle harvest multiple times", async function () {
     const amount = toEth("100");
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount);
     await vault.connect(user1).deposit(amount);

     await strategy.harvest();
     await strategy.harvest(); // Second harvest

     const balanceBefore = await mockUSDT.balanceOf(user1.address);
     await vault.connect(user1).claimRewards();
     const balanceAfter = await mockUSDT.balanceOf(user1.address);

     expect(balanceAfter).to.be.gt(balanceBefore);
   });

   it("Should handle deposit/withdraw sequence", async function () {
     const amount = toEth("1000");
     const half = toEth("10"); // Small amount to avoid rate limit
     await mockUSDT.connect(user1).approve(await vault.getAddress(), amount + half); // Approve enough for both
     await vault.connect(user1).deposit(amount);

     await vault.connect(user1).withdraw(half);
     expect(await vault.balances(user1.address)).to.equal(amount - half);

     await vault.connect(user1).deposit(half);
     expect(await vault.balances(user1.address)).to.equal(amount);
   });


});


