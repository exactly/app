export function transformClasses(style: any, classes: string) {
  if (!style) return 'style object is mandatory';

  const arr = classes?.split(' ') ?? [];
  return arr
    .map((val) => {
      return style[val] ?? '';
    })
    .join(' ');
}

export function formatWallet(walletAddress?: string) {
  if (!walletAddress) return '';
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}

export const toPercentage = (value?: number) => {
  if (value != null) {
    return value.toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return 'N/A';
};

export const checkPrecision = (value: string, decimals?: number): boolean => {
  const regex = new RegExp(`^\\d*([.,]\\d{1,${decimals ?? 18}})?$`, 'g');
  return regex.test(value);
};
