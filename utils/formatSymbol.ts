export default (value: string) => {
  if (value === 'WETH') {
    return 'ETH';
  } else if (value === 'USDC') {
    return 'USDC.e';
  }
  return value;
};
