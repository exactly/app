import { Chain } from '@wagmi/core';
import { AlchemyProvider } from '@ethersproject/providers';

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const alchemy = (chain: Chain): AlchemyProvider => {
  if (!alchemyKey) {
    throw new Error('Alchemy API key is not set');
  }

  return new AlchemyProvider(chain.id, alchemyKey);
};
