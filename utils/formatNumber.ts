import { Dictionary } from 'types/Dictionary';

function formatNumber(number: string | number, symbol: string, standard?: boolean) {
  const parsedNumber = typeof number == 'string' ? parseFloat(number) : number;

  const dictionary: Dictionary<number> = {
    USD: 2,
    DAI: 2,
    USDC: 2,
    WETH: 8,
    WBTC: 8
  };

  return new Intl.NumberFormat('en-GB', {
    notation: standard ? 'standard' : 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: dictionary[symbol.toUpperCase()] ?? 2
  }).format(parsedNumber);
}

export default formatNumber;
