function parseHealthFactor(debt: number, collateral: number) {
  //TODO => check case when the user doesn't have any collateral or debt
  return collateral == 0 || debt == 0 ? '1' : (collateral / debt).toFixed(2);
}
export default parseHealthFactor;
