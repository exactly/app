function parseHealthFactor(debt: number, collateral: number) {
  return (collateral / debt).toFixed(2);
}

export default parseHealthFactor;
