import { useEffect, useState } from 'react';
import { Address } from 'viem';

import { socketRequest } from 'utils/socket';
import { useWeb3 } from './useWeb3';
import { TokenPrice } from 'types/Bridge';

export const useAssetPrice = (token?: Address) => {
  const { chain } = useWeb3();

  const [price, setPrice] = useState<TokenPrice>();

  useEffect(() => {
    if (!token) return;
    (async () => {
      const result = await socketRequest<TokenPrice>('token-price', {
        chainId: String(chain.id),
        tokenAddress: token,
      });

      setPrice(result);
    })();
  }, [chain.id, token]);

  return price;
};
