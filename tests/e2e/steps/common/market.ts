import * as Dashboard from '../dashboard';
import { Coin } from '../../utils/tenderly';

type TestParams = {
  symbol: Coin;
};

export const enterMarket = ({ symbol }: TestParams) => {
  symbol = symbol === 'ETH' ? 'WETH' : symbol;

  describe(`${symbol} enter market`, () => {
    it('should not be checked or disabled', () => {
      Dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });

    it('should display a tooltip on mouseover', () => {
      Dashboard.checkCollateralSwitchTooltip(symbol, 'Enable this asset as collateral');
    });

    it(`should trigger an enter market for ${symbol} and start loading`, () => {
      Dashboard.attemptEnterMarket(symbol);
      Dashboard.checkCollateralSwitchStatusLoading(symbol);
    });

    it('should go back to unchecked if the tx is rejected', () => {
      cy.rejectMetamaskTransaction();
      Dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });

    it('should enter market if the tx is accepted', () => {
      Dashboard.attemptEnterMarket(symbol);
      cy.confirmMetamaskTransaction();
      Dashboard.waitForTransaction(symbol);
      Dashboard.checkCollateralSwitchStatus(symbol, false, true);
    });
  });
};

export const exitMarket = ({ symbol }: TestParams) => {
  symbol = symbol === 'ETH' ? 'WETH' : symbol;

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

    it(`should trigger an exit market for ${symbol} and start loading`, () => {
      Dashboard.attemptExitMarket(symbol);
      Dashboard.checkCollateralSwitchStatusLoading(symbol);
    });

    it('should go back to checked if the tx is rejected', () => {
      cy.rejectMetamaskTransaction();
      Dashboard.checkCollateralSwitchStatus(symbol, false, true);
    });

    it('should exit market if the tx is accepted', () => {
      Dashboard.attemptExitMarket(symbol);
      cy.confirmMetamaskTransaction();
      Dashboard.waitForTransaction(symbol);
      Dashboard.checkCollateralSwitchStatus(symbol, false, false);
    });
  });
};
