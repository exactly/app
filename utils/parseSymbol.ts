function parseSymbol(value: string) {
  const upperCaseValue = value.toUpperCase();
  if (upperCaseValue == 'WETH') {
    return 'ETH';
  }

  return upperCaseValue;
}

export default parseSymbol;
