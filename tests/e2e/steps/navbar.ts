import { type ERC20TokenSymbol } from '../utils/contracts';

type Path = 'markets' | 'dashboard' | ERC20TokenSymbol;

export const goTo = (path: Path) => {
  switch (path) {
    case 'markets':
    case 'dashboard':
      return cy.getByTestId(`navbar-link-${path}`).click();
    default:
      return cy.getByTestId(`markets-floating-pool-row-${path}`);
  }
};
