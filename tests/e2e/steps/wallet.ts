export const connectWallet = () => {
  let connected = false;
  cy.waitUntil(
    () =>
      cy.getByTestId('navbar').then(($navbar) => {
        const $wallet = $navbar.find('[data-testid="wallet-menu"]');
        if ($wallet.length) {
          connected = true;
          return true;
        }

        const $connect = $navbar.find('[data-testid="connect-wallet"]');
        if ($connect.length) {
          $connect.trigger('click');
          return false;
        }
        return false;
      }),
    { timeout: 20000, interval: 1000 },
  ).then(() => {
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
  let disconnected = false;
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
          disconnected = true;
          return true;
        }

        return false;
      }),
    { timeout: 20000, interval: 1000 },
  ).then(() => {
    if (!disconnected) {
      throw new Error('Wallet disconnection failed');
    }
  });
};
