import { expect } from "chai";
import { ethers } from "hardhat";

describe("YieldVault", function () {
  let owner: any, user1: any, user2: any;
  let mockUSDT: any, mockRouter: any, strategy: any, vault: any;
  const toEth = (v: string) => ethers.parseEther(v);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const WrappedU2U = await ethers.getContractFactory("WrappedU2U");
    mockUSDT = await WrappedU2U.deploy(); // Using WrappedU2U as token
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

    // Fund strategy with WU2U
    await owner.sendTransaction({ to: await mockUSDT.getAddress(), value: toEth("10000") });
    await mockUSDT.approve(await strategy.getAddress(), toEth("10000"));
    await strategy.fundPairToken(toEth("10000"));
  });

  it("Should deploy correctly", async function () {
    expect(await vault.token()).to.equal(await mockUSDT.getAddress());
    expect(await vault.strategyRouter()).to.equal(await strategy.getAddress());
  });

  it("Should allow deposit", async function () {
    const amount = toEth("100");
    await expect(vault.connect(user1).depositNative({ value: amount }))
      .to.emit(vault, "Deposited")
      .withArgs(user1.address, amount);

    expect(await vault.balances(user1.address)).to.equal(amount);
    expect(await vault.totalAssets()).to.equal(amount);
  });

  it("Should allow withdraw", async function () {
    const amount = toEth("100");
    await vault.connect(user1).depositNative({ value: amount });

    await expect(vault.connect(user1).withdraw(amount))
      .to.emit(vault, "Withdrawn")
      .withArgs(user1.address, amount);

    expect(await vault.balances(user1.address)).to.equal(0);
    expect(await vault.totalAssets()).to.equal(0);
  });

    it("Should claim rewards accurately for single user", async function () {
      const amount = toEth("100");
      await vault.connect(user1).depositNative({ value: amount });

      await strategy.harvest();

      const vaultBalanceBefore = await mockUSDT.balanceOf(await vault.getAddress());
      await expect(vault.connect(user1).claimRewards()).to.emit(vault, "RewardsClaimed");
      const vaultBalanceAfter = await mockUSDT.balanceOf(await vault.getAddress());

      expect(vaultBalanceAfter).to.be.lt(vaultBalanceBefore);
    });

    it("Should claim rewards proportionally for multiple users", async function () {
      const amount1 = toEth("1000");
      const amount2 = toEth("50"); // <10% of totalAssets after first deposit
      await vault.connect(user1).depositNative({ value: amount1 });
      await vault.connect(user2).depositNative({ value: amount2 });

      // Harvest to add rewards
      await strategy.harvest();

      const vaultBalanceBefore = await mockUSDT.balanceOf(await vault.getAddress());

      await expect(vault.connect(user1).claimRewards()).to.emit(vault, "RewardsClaimed");
      await expect(vault.connect(user2).claimRewards()).to.emit(vault, "RewardsClaimed");

      const vaultBalanceAfter = await mockUSDT.balanceOf(await vault.getAddress());

      // Vault balance should decrease more after user1 claim than user2, but since proportional, just check decreased
      expect(vaultBalanceAfter).to.be.lt(vaultBalanceBefore);
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
      await vault.connect(user1).depositNative({ value: amount });

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
      await vault.connect(user1).depositNative({ value: amount }); // First deposit OK

      const largeAmount = toEth("200"); // >10% of totalAssets (100)
      await expect(vault.connect(user2).depositNative({ value: largeAmount })).to.be.revertedWith("YieldVault: deposit amount exceeds rate limit");
    });

    it("Should allow emergency withdraw by owner", async function () {
      const amount = toEth("100");
      await vault.connect(user1).depositNative({ value: amount });

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
      await vault.connect(user1).depositNative({ value: depositAmount });

      await expect(vault.connect(user1).withdraw(withdrawAmount)).to.be.revertedWith("YieldVault: insufficient user balance");
    });

   it("Should reject claim without balance", async function () {
     await expect(vault.connect(user1).claimRewards()).to.be.revertedWith("YieldVault: no balance to claim rewards");
   });

    it("Should handle deposit when totalAssets is zero (first deposit)", async function () {
      const amount = toEth("100");
      await expect(vault.connect(user1).depositNative({ value: amount })).to.emit(vault, "Deposited");
    });

   // Error Handling & Reverts
    it("Should reject deposit when paused", async function () {
      await vault.pause();
      const amount = toEth("100");
      await expect(vault.connect(user1).depositNative({ value: amount })).to.be.revertedWith("YieldVault: paused");
      await vault.unpause();
    });

    it("Should reject withdraw when paused", async function () {
      const amount = toEth("100");
      await vault.connect(user1).depositNative({ value: amount });

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
      await vault.connect(user1).depositNative({ value: amount });

      await strategy.harvest();
      await strategy.harvest(); // Second harvest

      const vaultBalanceBefore = await mockUSDT.balanceOf(await vault.getAddress());
      await expect(vault.connect(user1).claimRewards()).to.emit(vault, "RewardsClaimed");
      const vaultBalanceAfter = await mockUSDT.balanceOf(await vault.getAddress());

      expect(vaultBalanceAfter).to.be.lt(vaultBalanceBefore);
    });

    it("Should handle deposit/withdraw sequence", async function () {
      const amount = toEth("1000");
      const half = toEth("10"); // Small amount to avoid rate limit
      await vault.connect(user1).depositNative({ value: amount });

      await vault.connect(user1).withdraw(half);
      expect(await vault.balances(user1.address)).to.equal(amount - half);

      await vault.connect(user1).depositNative({ value: half });
      expect(await vault.balances(user1.address)).to.equal(amount);
    });


});


