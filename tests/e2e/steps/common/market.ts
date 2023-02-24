import * as Dashboard from '../dashboard';
import { Coin } from '../../utils/tenderly';

type TestParams = {
  symbol: Coin;
};

export const enterMarket = ({ symbol }: TestParams) => {
  describe(`${symbol} enter market`, () => {
    it('should not be checked or disabled', () => {
      Dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });

    it('should display a tooltip on mouseover', () => {
      Dashboard.checkCollateralSwitchTooltip(symbol, 'Enable this asset as collateral');
    });

    it('should enter market if the tx is accepted', () => {
      Dashboard.attemptEnterMarket(symbol);
      Dashboard.waitForTransaction(symbol);
      Dashboard.checkCollateralSwitchStatus(symbol, false, true);
    });
  });
};

export const exitMarket = ({ symbol }: TestParams) => {
  describe(`${symbol} exit market`, () => {
    it('should be checked and not disabled', () => {
      Dashboard.checkCollateralSwitchStatus(symbol, false, true);
    });

    it('should display a tooltip on mouseover', () => {
      Dashboard.checkCollateralSwitchTooltip(
        symbol,
        'Disabling this asset as collateral affects your borrowing power and Health Factor',
      );
    });

    it('should exit market if the tx is accepted', () => {
      Dashboard.attemptExitMarket(symbol);
      Dashboard.waitForTransaction(symbol);
      Dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });
  });
};
