describe('Test Connect Wallet', () => {
  let userAddress;

  before(() => {
    cy.getMetamaskWalletAddress().then((address) => (userAddress = address));
    cy.visit('/', {
      onBeforeLoad: function (window) {
        window.localStorage.setItem('tos', 'true');
      },
    });
  });

  it('Connects with Metamask', () => {
    cy.contains('Connect wallet').click();
    cy.get('w3m-modal').shadow().find('[name="MetaMask"]', { includeShadowDom: true }).click();
    cy.acceptMetamaskAccess();

    cy.get(`[data-test-id=user-address]`)
      .should('be.visible')
      .and('contain', userAddress.substring(0, 6))
      .and('contain', userAddress.substring(38));
  });
});
