import base from '../../fixture/base';
import _balance from '../../common/balance';
import _borrow from '../../common/borrow';
import _repay from '../../common/repay';
import _app from '../../common/app';
import _navbar from '../../components/navbar';
import _dashboard from '../../page/dashboard';

const test = base();

test('USDC floating borrow/repay', async ({ page, web3, setup }) => {
  await web3.anvil.setBalance(web3.account.address, {
    ETH: 100,
  });

  await page.goto('/USDC');

  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const borrow = _borrow({ test, page });
  const repay = _repay({ test, page });
  const app = _app({ test, page });
  const navbar = _navbar(page);
  const dashboard = _dashboard(page);

  await borrow.attempt({ type: 'floating', symbol: 'USDC', amount: '10' });

  await setup.enterMarket('WETH');
  await setup.deposit({ symbol: 'ETH', amount: '10', receiver: web3.account.address });
  await app.reload();

  await borrow.execute({
    type: 'floating',
    symbol: 'USDC',
    amount: '50',
    aboveLiquidityAmount: 1_000_000_000_000,
  });

  await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '50' });

  await navbar.goTo('dashboard');

  await test.step('assert: WETH collateral locked', async () => {
    await dashboard.checkCollateralSwitchStatus('WETH', true, true);
  });

  await test.step('tooltip: WETH collateral locked', async () => {
    await dashboard.checkCollateralSwitchTooltip(
      'WETH',
      'Disabling this collateral will make your health factor less than 1',
    );
  });

  await dashboard.switchTab('borrow');
  await dashboard.checkFloatingTableRow('borrow', 'USDC');

  await repay.execute({
    type: 'floating',
    symbol: 'USDC',
    amount: '25',
    shouldApprove: true,
  });

  await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '25', delta: '0.00005' });
});
