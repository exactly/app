import { type ERC20TokenSymbol } from '../utils/contracts';
import { justWait } from './actions';

type Path = 'markets' | 'dashboard' | ERC20TokenSymbol;

export const goTo = (path: Path) => {
  switch (path) {
    case 'markets':
    case 'dashboard':
      cy.getByTestId(`navbar-link-${path}`).click();
      break;
    default:
      cy.getByTestId(`markets-floating-pool-row-${path}`);
      break;
  }

  return justWait();
};
