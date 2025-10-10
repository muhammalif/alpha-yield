import { expect } from "chai";
import { ethers } from "hardhat";

describe("AIController integration", function () {
  let owner: any, strategist: any, user: any;
  let mockUSDT: any, mockRouter: any, vault: any, strategy: any, controller: any;

  const toEth = (v: string) => ethers.parseEther(v);

  beforeEach(async function () {
    [owner, strategist, user] = await ethers.getSigners();

    const WrappedU2U = await ethers.getContractFactory("WrappedU2U");
    mockUSDT = await WrappedU2U.deploy();
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

    // Fund strategy
    await owner.sendTransaction({ to: await mockUSDT.getAddress(), value: toEth("1000") });
    await mockUSDT.approve(await strategy.getAddress(), toEth("1000"));
    await strategy.fundPairToken(toEth("1000"));

    const AIController = await ethers.getContractFactory("AIController");
    controller = await AIController.deploy(owner.address, strategist.address);
    await controller.waitForDeployment();

    await strategy.setAIController(await controller.getAddress());
  });

  it("harvest should respect AI shouldHarvest flag", async function () {
    await vault.connect(user).depositNative({ value: toEth("100") });

    await expect(strategy.harvest()).to.be.revertedWith("SimpleStrategy: AI disallows harvest");

    await controller.connect(strategist).setShouldHarvest(true);
    await expect(strategy.harvest()).to.not.be.reverted;
  });

    it.skip("deposit/withdraw should override slippage from AI controller when set", async function () {
      await controller.connect(strategist).setTargetSlippage(40);

      await expect(vault.connect(user).depositNative({ value: toEth("10") })).to.emit(vault, "Deposited");
      await expect(vault.connect(user).withdraw(toEth("10"))).to.emit(vault, "Withdrawn");
    });

   it("should reject high slippage", async function () {
     await expect(controller.connect(strategist).setTargetSlippage(2000)).to.be.revertedWith("AIController: slippage too high");
   });

   it("should allow valid slippage", async function () {
     await expect(controller.connect(strategist).setTargetSlippage(500)).to.not.be.reverted;
     expect(await controller.targetSlippageBps()).to.equal(500);
   });

   it("should reject set slippage by non-strategist", async function () {
     await expect(controller.connect(user).setTargetSlippage(500)).to.be.revertedWith("AIController: not strategist");
   });

   it("should reject set strategist by non-owner", async function () {
     await expect(controller.connect(user).setStrategist(user.address)).to.be.revertedWithCustomError(controller, "OwnableUnauthorizedAccount");
   });

   it("should update strategist", async function () {
     await controller.connect(owner).setStrategist(user.address);
     expect(await controller.strategist()).to.equal(user.address);
   });

    it("should handle harvest without AI approval", async function () {
      const amount = toEth("100");
      await vault.connect(user).depositNative({ value: amount }); // Deposit first to have assets

      await controller.connect(strategist).setShouldHarvest(false);
      await expect(strategy.harvest()).to.be.revertedWith("SimpleStrategy: AI disallows harvest");
    });
});


