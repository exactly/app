import { Chain, createPublicClient, http } from 'viem';

export type AlchemyProvider = ReturnType<typeof createPublicClient>;

const alchemyProvidersHost: Record<number, string> = {
  1: 'eth-mainnet.alchemyapi.io/v2/',
  5: 'eth-goerli.g.alchemy.com/v2/',
  10: 'opt-mainnet.g.alchemy.com/v2/',
};

export const getAlchemyProvider = (chain: Chain): AlchemyProvider => {
  const host = alchemyProvidersHost[chain.id];
  if (!host) throw new Error(`No Alchemy provider for chain ${chain.id}`);

  return createPublicClient({
    chain,
    transport: http(`https://${host}${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
  });
};
