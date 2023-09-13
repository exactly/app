import _dashboard from '../page/dashboard';
import type { ERC20TokenSymbol } from '../utils/contracts';
import type { CommonTest } from './types';

type TestParams = {
  symbol: ERC20TokenSymbol;
};

export default function ({ test, page }: CommonTest) {
  const dashboard = _dashboard(page);

  const enterMarket = async ({ symbol }: TestParams) => {
    await test.step(`${symbol} enter market`, async () => {
      await test.step('should not be checked or disabled', async () => {
        await dashboard.checkCollateralSwitchStatus(symbol, false, false);
      });

      await test.step('should display a tooltip on mouseover', async () => {
        await dashboard.checkCollateralSwitchTooltip(symbol, 'Enable this asset as collateral');
      });

      await test.step('should enter market if the tx is accepted', async () => {
        await dashboard.attemptEnterMarket(symbol);
        await dashboard.waitForTransaction(symbol);
        await dashboard.checkCollateralSwitchStatus(symbol, false, true);
      });
    });
  };

  const exitMarket = async ({ symbol }: TestParams) => {
    await test.step(`${symbol} exit market`, async () => {
      await test.step('should be checked and not disabled', async () => {
        await dashboard.checkCollateralSwitchStatus(symbol, false, true);
      });

      await test.step('should display a tooltip on mouseover', async () => {
        await dashboard.checkCollateralSwitchTooltip(
          symbol,
          'Disabling this asset as collateral affects your borrowing power and Health Factor',
        );
      });

      await test.step('should exit market if the tx is accepted', async () => {
        await dashboard.attemptExitMarket(symbol);
        await dashboard.waitForTransaction(symbol);
        await dashboard.checkCollateralSwitchStatus(symbol, false, false);
      });
    });
  };

  return { enterMarket, exitMarket };
}
