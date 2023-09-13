import base from '../../fixture/base';
import _balance from '../../common/balance';
import _borrow from '../../common/borrow';
import _repay from '../../common/repay';
import _app from '../../common/app';
import _navbar from '../../components/navbar';
import _dashboard from '../../page/dashboard';

const test = base();

test.describe.configure({ mode: 'serial' });

test('USDC floating borrow/repay', async ({ page, web3, setup }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 100,
  });

  await page.goto('/');

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

  await test.step('should have both USDC and ETH collateral switch checked and disabled', async () => {
    await dashboard.checkCollateralSwitchStatus('USDC', true, true);
    await dashboard.checkCollateralSwitchStatus('WETH', true, true);
  });

  await test.step('should have both USDC and ETH switches with a tooltip explaining why are disabled', async () => {
    await dashboard.checkCollateralSwitchTooltip(
      'WETH',
      'Disabling this collateral will make your health factor less than 1',
    );
    await dashboard.checkCollateralSwitchTooltip(
      'USDC',
      "You can't disable collateral on this asset because you have an active borrow",
    );
  });

  await dashboard.switchTab('borrow');

  await repay.execute({
    type: 'floating',
    symbol: 'USDC',
    amount: '25',
    shouldApprove: true,
  });

  await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '25', delta: 0.00005 });
});
