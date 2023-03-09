export const connectWallet = () => {
  cy.waitUntil(
    () =>
      cy.getByTestId('navbar').then(($navbar) => {
        const $wallet = $navbar.find('[data-testid="wallet-menu"]');
        if ($wallet.length) {
          return true;
        }

        const $connect = $navbar.find('[data-testid="connect-wallet"]');
        if ($connect.length) {
          $connect.trigger('click');
          return false;
        }
      }),
    { timeout: 20000, interval: 1000 },
  ).then((connected: boolean) => {
    if (!connected) {
      throw new Error('Wallet connection failed');
    }
  });
};

export const disconnectWallet = () => {
  cy.getByTestId('wallet-menu').click();
  cy.getByTestId('wallet-menu-disconnect').should('be.visible').click();
};
