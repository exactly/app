import { useEffect, useState } from 'react';
import { Address } from 'viem';

import { socketRequest } from 'utils/socket';
import { TokenPrice } from 'types/Bridge';
import { defaultChain } from 'utils/client';

export const useAssetPrice = (token?: Address) => {
  const [price, setPrice] = useState<TokenPrice>();

  useEffect(() => {
    if (!token) return;
    (async () => {
      const result = await socketRequest<TokenPrice>('token-price', {
        chainId: String(defaultChain.id),
        tokenAddress: token,
      });

      setPrice(result);
    })();
  }, [token]);

  return price;
};
