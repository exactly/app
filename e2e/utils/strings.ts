import dayjs from 'dayjs';

export const pastParticiple = (word: string): string => {
  const past: Record<string, string> = {
    deposit: 'deposited',
    withdraw: 'withdrawn',
    repay: 'repaid',
    borrow: 'borrowed',
  };

  return past[word] || `${word}ed`;
};

export const capitalize = (word: string): string => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;

export const repeat = (len: number, c: string) => Array.from({ length: len }).fill(c).join('');

export const formatSymbol = (symbol: string): string => {
  return symbol === 'WETH' ? 'ETH' : symbol;
};

export const formatMaturity = (timestamp: number): string => {
  return dayjs.unix(timestamp).format('MMM DD, YYYY');
};
