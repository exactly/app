describe('Deposit', () => {
  let userAddress;

  before(() => {
    cy.getMetamaskWalletAddress().then((address) => (userAddress = address));
    cy.visit('/', {
      onBeforeLoad: function (window) {
        window.localStorage.setItem('tos', 'true');
      },
    });
    cy.contains('Connect wallet').click();
    cy.get('w3m-modal').shadow().find('[name="MetaMask"]', { includeShadowDom: true }).click();
    cy.acceptMetamaskAccess();
  });

  it('Deposit DAI', () => {
    cy.get(`[data-test-id=floating-deposit-DAI]`).click();
    cy.get(`[data-test-id=modal-input]`).type('10');
    cy.get('[data-test-id=modal-submit]', { timeout: 15000 }).click();
    cy.confirmMetamaskTransaction();
    cy.contains('Transaction Completed!').should('be.visible');
  });
});
