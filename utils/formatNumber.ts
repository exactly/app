const dictionary: Record<string, number> = {
  USD: 2,
  DAI: 2,
  USDC: 2,
  WETH: 6,
  WBTC: 6,
  wstETH: 6,
};

function formatNumber(number: string | number, symbol?: string, standard?: boolean) {
  const parsedNumber = typeof number === 'string' ? parseFloat(number) : number;

  return new Intl.NumberFormat('en-GB', {
    notation: standard ? 'standard' : 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 2,
    maximumFractionDigits: symbol ? dictionary[symbol] : 2,
  }).format(parsedNumber);
}

export default formatNumber;
