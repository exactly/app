import { justWait } from './actions';

type Path = 'markets' | 'dashboard';

export const goTo = (path: Path) => {
  cy.getByTestId(`navbar-link-${path}`).click();
  return justWait();
};
