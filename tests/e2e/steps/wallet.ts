export const connectWallet = () => {
  cy.getByTestId('connect-wallet').click();
};

export const disconnectWallet = () => {
  cy.getByTestId('wallet-menu').click();
  cy.getByTestId('wallet-menu-disconnect').should('be.visible').click();
};
