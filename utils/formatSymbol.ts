import { optimism } from 'viem/chains';
import { isE2E } from 'utils/client';

export default (value: string) => {
  const networkId = Number(process.env.NEXT_PUBLIC_NETWORK ?? optimism.id);
  if (value === 'WETH') {
    return 'ETH';
  } else if (value === 'USDC.e' && networkId === optimism.id) {
    return isE2E ? 'USDC' : value;
  }
  return value;
};
