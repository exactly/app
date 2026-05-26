import _dashboard from '../page/dashboard';
import type { ERC20TokenSymbol } from '../utils/contracts';
import type { CommonTest } from './types';

type TestParams = {
  symbol: ERC20TokenSymbol;
};

export default function ({ test, page }: CommonTest) {
  const dashboard = _dashboard(page);

  const enterMarket = async ({ symbol }: TestParams) => {
    await test.step(`market: enter ${symbol}`, async () => {
      await test.step(`assert: ${symbol} collateral switch off`, async () => {
        await dashboard.checkCollateralSwitchStatus(symbol, false, false);
      });

      await test.step(`tooltip: ${symbol} enter market`, async () => {
        await dashboard.checkCollateralSwitchTooltip(symbol, 'Enable this asset as collateral');
      });

      await test.step(`tx: submit enter market ${symbol}`, async () => {
        await dashboard.attemptEnterMarket(symbol);
      });

      await test.step(`tx: wait enter market ${symbol}`, async () => {
        await dashboard.waitForTransaction(symbol);
      });

      await test.step(`assert: ${symbol} collateral switch on`, async () => {
        await dashboard.checkCollateralSwitchStatus(symbol, false, true);
      });
    });
  };

  const exitMarket = async ({ symbol }: TestParams) => {
    await test.step(`market: exit ${symbol}`, async () => {
      await test.step(`assert: ${symbol} collateral switch on`, async () => {
        await dashboard.checkCollateralSwitchStatus(symbol, false, true);
      });

      await test.step(`tooltip: ${symbol} exit market`, async () => {
        await dashboard.checkCollateralSwitchTooltip(
          symbol,
          'Disabling this asset as collateral affects your borrowing power and Health Factor',
        );
      });

      await test.step(`tx: submit exit market ${symbol}`, async () => {
        await dashboard.attemptExitMarket(symbol);
      });

      await test.step(`tx: wait exit market ${symbol}`, async () => {
        await dashboard.waitForTransaction(symbol);
      });

      await test.step(`assert: ${symbol} collateral switch off`, async () => {
        await dashboard.checkCollateralSwitchStatus(symbol, false, false);
      });
    });
  };

  return { enterMarket, exitMarket };
}
