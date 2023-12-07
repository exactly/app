import { optimism } from 'viem/chains';

export default (value: string) => {
  const networkId = Number(process.env.NEXT_PUBLIC_NETWORK ?? optimism.id);
  if (value === 'WETH') {
    return 'ETH';
  } else if (value === 'USDC' && networkId === optimism.id) {
    return 'USDC.e';
  }
  return value;
};
