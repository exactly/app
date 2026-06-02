// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.17;

import { Auditor, IPriceFeed } from "@exactly/protocol/Auditor.sol";
import { InterestRateModel, Parameters } from "@exactly/protocol/InterestRateModel.sol";
import { Market } from "@exactly/protocol/Market.sol";
import { MarketETHRouter } from "@exactly/protocol/MarketETHRouter.sol";
import { MockBalancerVault } from "@exactly/protocol/mocks/MockBalancerVault.sol";
import { MockPriceFeed } from "@exactly/protocol/mocks/MockPriceFeed.sol";
import { MockWETH } from "@exactly/protocol/mocks/MockWETH.sol";
import { DebtManager, IBalancerVault, IPermit2 } from "@exactly/protocol/periphery/DebtManager.sol";
import { DebtPreviewer } from "@exactly/protocol/periphery/DebtPreviewer.sol";
import { EscrowedEXA, ISablierV2LockupLinear } from "@exactly/protocol/periphery/EscrowedEXA.sol";
import { EXA } from "@exactly/protocol/periphery/EXA.sol";
import { InstallmentsRouter } from "@exactly/protocol/periphery/InstallmentsRouter.sol";
import { IntegrationPreviewer } from "@exactly/protocol/periphery/IntegrationPreviewer.sol";
import { Previewer } from "@exactly/protocol/periphery/Previewer.sol";
import { RatePreviewer } from "@exactly/protocol/periphery/RatePreviewer.sol";
import { StakedEXA, Parameters as StakingParameters, IERC20 } from "@exactly/protocol/StakedEXA.sol";
import { StakingPreviewer } from "@exactly/protocol/periphery/StakingPreviewer.sol";
import { Firewall } from "@exactly/protocol/verified/Firewall.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { MockERC20 } from "solmate/src/test/utils/mocks/MockERC20.sol";

import { MockPermit2 } from "../src/MockPermit2.sol";
import { MockSablierV2LockupLinear } from "../src/MockSablierV2LockupLinear.sol";
import { MockSablierV2NFTDescriptor } from "../src/MockSablierV2NFTDescriptor.sol";
import { MockSwapper } from "../src/MockSwapper.sol";

interface Vm {
  function startBroadcast() external;
  function stopBroadcast() external;
}

contract DeployProtocol {
  Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

  Auditor public auditor;
  DebtManager public debtManager;
  DebtPreviewer public debtPreviewer;
  EXA public exa;
  Firewall public firewall;
  InstallmentsRouter public installmentsRouter;
  IntegrationPreviewer public integrationPreviewer;
  Market public marketEXA;
  Market public marketOP;
  Market public marketUSDC;
  Market public marketWETH;
  MarketETHRouter public marketETHRouter;
  MockBalancerVault public balancer2Vault;
  MockERC20 public op;
  MockERC20 public usdc;
  MockPermit2 public permit2;
  MockPriceFeed public priceFeedEXA;
  MockPriceFeed public priceFeedOP;
  MockPriceFeed public priceFeedUSDC;
  MockPriceFeed public priceFeedWETH;
  MockPriceFeed public priceFeedesEXA;
  MockSablierV2LockupLinear public sablierV2LockupLinear;
  MockSablierV2NFTDescriptor public sablierV2NFTDescriptor;
  MockSwapper public swapper;
  MockWETH public weth;
  Previewer public previewer;
  RatePreviewer public ratePreviewer;
  EscrowedEXA public esEXA;
  StakedEXA public stEXA;
  StakingPreviewer public stakingPreviewer;

  function run() external {
    vm.startBroadcast();

    auditor = Auditor(
      address(
        new ERC1967Proxy(
          address(new Auditor(18)),
          abi.encodeCall(Auditor.initialize, (Auditor.LiquidationIncentive(0.09e18, 0.01e18)))
        )
      )
    );

    Parameters memory irmParams = Parameters({
      minRate: 3.5e16,
      naturalRate: 8e16,
      maxUtilization: 1.3e18,
      naturalUtilization: 0.75e18,
      growthSpeed: 1.1e18,
      sigmoidSpeed: 2.5e18,
      spreadFactor: 0.2e18,
      maturitySpeed: 0.5e18,
      timePreference: 0.01e18,
      fixedAllocation: 0.6e18,
      maxRate: 15_000e16
    });
    InterestRateModel irm = InterestRateModel(address(0));

    exa = EXA(address(new ERC1967Proxy(address(new EXA()), abi.encodeCall(EXA.initialize, ()))));
    priceFeedEXA = new MockPriceFeed(18, 5e18);
    marketEXA = market(ERC20(address(exa)), "EXA", 1e18, irm, irmParams, priceFeedEXA, 0.8e18);

    usdc = new MockERC20("USD Coin", "USDC", 6);
    priceFeedUSDC = new MockPriceFeed(18, 1e18);
    marketUSDC = market(usdc, "USDC", 1e6, irm, irmParams, priceFeedUSDC, 0.9e18);

    weth = new MockWETH();
    priceFeedWETH = new MockPriceFeed(18, 2500e18);
    marketWETH = market(weth, "WETH", 1e18, irm, irmParams, priceFeedWETH, 0.86e18);

    op = new MockERC20("Optimism", "OP", 18);
    priceFeedOP = new MockPriceFeed(18, 2e18);
    marketOP = market(op, "OP", 1e18, irm, irmParams, priceFeedOP, 0.8e18);

    balancer2Vault = new MockBalancerVault();
    permit2 = new MockPermit2();
    debtManager = DebtManager(
      address(
        new ERC1967Proxy(
          address(new DebtManager(auditor, IPermit2(address(permit2)), IBalancerVault(address(balancer2Vault)))),
          abi.encodeCall(DebtManager.initialize, ())
        )
      )
    );
    debtPreviewer = new DebtPreviewer(debtManager);
    previewer = new Previewer(auditor, IPriceFeed(address(0)));
    integrationPreviewer = new IntegrationPreviewer(auditor);
    ratePreviewer = new RatePreviewer(auditor);
    marketETHRouter = MarketETHRouter(
      payable(
        address(
          new ERC1967Proxy(address(new MarketETHRouter(marketWETH)), abi.encodeCall(MarketETHRouter.initialize, ()))
        )
      )
    );
    installmentsRouter = new InstallmentsRouter(auditor, marketWETH);
    firewall = Firewall(address(new ERC1967Proxy(address(new Firewall()), abi.encodeCall(Firewall.initialize, ()))));

    sablierV2LockupLinear = new MockSablierV2LockupLinear();
    sablierV2NFTDescriptor = new MockSablierV2NFTDescriptor();
    priceFeedesEXA = priceFeedEXA;
    esEXA = EscrowedEXA(
      address(
        new ERC1967Proxy(
          address(new EscrowedEXA(exa, ISablierV2LockupLinear(address(sablierV2LockupLinear)))),
          abi.encodeCall(EscrowedEXA.initialize, (uint40(7 days), 0.25e18))
        )
      )
    );

    swapper = new MockSwapper(ERC20(address(exa)));
    exa.transfer(address(swapper), 1_000_000e18);
    exa.transfer(address(balancer2Vault), 1_000_000e18);
    usdc.mint(address(balancer2Vault), 1_000_000e6);
    weth.mint(address(balancer2Vault), 1_000_000e18);
    op.mint(address(balancer2Vault), 1_000_000e18);

    exa.approve(address(marketEXA), type(uint256).max);
    marketEXA.deposit(1_000_000e18, msg.sender);
    usdc.mint(msg.sender, 1_000_000e6);
    usdc.approve(address(marketUSDC), type(uint256).max);
    marketUSDC.deposit(1_000_000e6, msg.sender);
    weth.deposit{ value: 10_000e18 }();
    weth.approve(address(marketWETH), type(uint256).max);
    marketWETH.deposit(10_000e18, msg.sender);
    op.mint(msg.sender, 1_000_000e18);
    op.approve(address(marketOP), type(uint256).max);
    marketOP.deposit(1_000_000e18, msg.sender);

    stEXA = StakedEXA(
      address(
        new ERC1967Proxy(
          address(new StakedEXA()),
          abi.encodeCall(
            StakedEXA.initialize,
            (
              StakingParameters({
                asset: IERC20(address(exa)),
                minTime: 0,
                refTime: 4 weeks,
                excessFactor: 0.9e18,
                penaltyGrowth: 2e18,
                penaltyThreshold: 0.1e18,
                market: marketUSDC,
                provider: msg.sender,
                savings: msg.sender,
                duration: uint40(2 weeks),
                providerRatio: 0.1e18
              })
            )
          )
        )
      )
    );
    stakingPreviewer = new StakingPreviewer(stEXA);
    marketUSDC.approve(address(stEXA), type(uint256).max);

    vm.stopBroadcast();
  }

  function market(
    ERC20 asset,
    string memory symbol,
    uint128 earningsAccumulatorSmoothFactor,
    InterestRateModel irm,
    Parameters memory irmParams,
    IPriceFeed priceFeed,
    uint128 adjustFactor
  ) internal returns (Market m) {
    m = Market(
      address(
        new ERC1967Proxy(
          address(new Market(asset, auditor)),
          abi.encodeCall(
            Market.initialize,
            (
              symbol,
              7,
              type(uint256).max,
              earningsAccumulatorSmoothFactor,
              irm,
              0.02e18 / uint256(1 days),
              1e17,
              0,
              1e18,
              1e18
            )
          )
        )
      )
    );
    m.setInterestRateModel(new InterestRateModel(irmParams, m));
    auditor.enableMarket(m, priceFeed, adjustFactor);
  }
}
