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

export const walletConnected = (address: string) => {
  cy.getByTestId('user-address')
    .should('be.visible')
    .and('contain', address.substring(0, 6))
    .and('contain', address.substring(38));
};

export const disconnectWallet = () => {
  cy.waitUntil(
    () =>
      cy.getByTestId('navbar').then(($navbar) => {
        const $wallet = $navbar.find('[data-testid="wallet-menu"]');
        if ($wallet.length) {
          cy.getByTestId('wallet-menu').trigger('click');
          cy.getByTestId('wallet-menu-disconnect').trigger('click');
          return false;
        }

        const $connect = $navbar.find('[data-testid="connect-wallet"]');
        if ($connect.length) {
          return true;
        }
      }),
    { timeout: 20000, interval: 1000 },
  ).then((disconnected: boolean) => {
    if (!disconnected) {
      throw new Error('Wallet disconnection failed');
    }
  });
};
