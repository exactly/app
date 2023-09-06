import { test } from '@guardianui/test';

test.describe('Exactly Deposit', () => {
  test('Should Deposit in simple market', async ({ page, gui }) => {
    // Initialize fork
    await gui.initializeChain(10);

    // Navigate to site
    await page.goto('http://localhost:3000/');

    // Mocking ETH and USDC balances
    await gui.setEthBalance('100000000000000000000000');
    // await gui.setBalance('0x7f5c764cbc14f9669b88837ca1490cca17c31607', '1000000000000000000000');

    // Connect wallet
    await new Promise((r) => setTimeout(r, 50000));
    // // Wait for site to recognize UNI balance
    // await page.waitForSelector('text=1,000 UNI');

    // // Enter UNI amount
    // await page.waitForSelector("input[placeholder='0']");
    // await page.locator("input[placeholder='0']").first().type('1');

    // // Click preview deposit button
    // await page.waitForSelector("button:has-text('Preview Deposit')");
    // await page.locator("button:has-text('Preview Deposit')").first().click();

    // // Click approve UNI button and verify contract target
    // await gui.validateContractInteraction(
    //   "button:has-text('Approve UNI') >> visible=true",
    //   '0xDD9d1B7dEaB1A843A1B584d2CA5903B8A4735deF',
    // );
  });
});
