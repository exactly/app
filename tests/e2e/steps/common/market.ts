import * as dashboard from '../dashboard';
import { ERC20TokenSymbol } from '../../utils/contracts';

type TestParams = {
  symbol: ERC20TokenSymbol;
};

export const enterMarket = ({ symbol }: TestParams) => {
  describe(`${symbol} enter market`, () => {
    it('should not be checked or disabled', () => {
      dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });

    it('should display a tooltip on mouseover', () => {
      dashboard.checkCollateralSwitchTooltip(symbol, 'Enable this asset as collateral');
    });

    it('should enter market if the tx is accepted', () => {
      dashboard.attemptEnterMarket(symbol);
      dashboard.waitForTransaction(symbol);
      dashboard.checkCollateralSwitchStatus(symbol, false, true);
    });
  });
};

export const exitMarket = ({ symbol }: TestParams) => {
  describe(`${symbol} exit market`, () => {
    it('should be checked and not disabled', () => {
      dashboard.checkCollateralSwitchStatus(symbol, false, true);
    });

    it('should display a tooltip on mouseover', () => {
      dashboard.checkCollateralSwitchTooltip(
        symbol,
        'Disabling this asset as collateral affects your borrowing power and Health Factor',
      );
    });

    it('should exit market if the tx is accepted', () => {
      dashboard.attemptExitMarket(symbol);
      dashboard.waitForTransaction(symbol);
      dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });
  });
};
