function parseHealthFactor(debt: number, collateral: number) {
  //TODO => check case when the user doesn't have any collateral or debt

  if (collateral <= 0 || debt <= 0) {
    return '1';
  } else {
    const healthFactor = collateral / debt;

    if (healthFactor > 10) return '10.00';

    return (collateral / debt).toFixed(2);
  }
}
export default parseHealthFactor;
