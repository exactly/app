import { createFork, deleteFork, rpcURL, transferAllTokens } from '../utils/tenderly';

export const connectMetamask = () => {
  cy.getByTestId('connect-wallet').click();
  cy.acceptMetamaskAccess();
};

type ForkParams = {
  chainId?: string;
};

export const setupFork = ({ chainId = '1' }: ForkParams = {}) => {
  let forkId: string | undefined = undefined;
  let userAddress: string | undefined = undefined;

  before(async () => {
    forkId = await createFork(chainId);
  });

  before(() => {
    cy.addMetamaskNetwork({
      networkName: 'e2e-tests',
      chainId: chainId,
      symbol: 'ETH',
      rpcUrl: rpcURL(forkId),
      isTestnet: false,
    });
    cy.getMetamaskWalletAddress().then((address) => (userAddress = address));
  });

  after(async () => {
    if (forkId) {
      await deleteFork(forkId);
    }
  });

  return {
    visit: (url: string) => {
      cy.visit(url, {
        onBeforeLoad: function (window) {
          window.localStorage.setItem('tos', 'true');
          window.rpcURL = rpcURL(forkId);
        },
      });
    },
    userAddress: () => userAddress,
    setUserBalance: () => transferAllTokens(rpcURL(forkId), userAddress),
  };
};
