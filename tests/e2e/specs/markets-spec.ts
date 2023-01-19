import { deposit } from '../steps/actions';
import { connectMetamask, setupFork } from '../steps/setup';

describe('Markets', () => {
  const { visit, setUserBalance } = setupFork();

  before(() => {
    visit('/');
    connectMetamask();
  });

  before('Set user balance', async () => {
    await setUserBalance();
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  it('Floating Deposit WETH', () => {
    floatingDepositSuccess('WETH');
  });

  it('Floating Deposit DAI', () => {
    floatingDepositSuccess('DAI');
  });

  it('Floating Deposit USDC', () => {
    floatingDepositSuccess('USDC');
  });

  it('Floating Deposit WBTC', () => {
    floatingDepositSuccess('WBTC');
  });

  it('Floating Deposit wstETH', () => {
    floatingDepositSuccess('wstETH');
  });
});

const floatingDepositSuccess = (symbol: string) => {
  deposit({ type: 'floating', symbol, amount: 10 });
};
