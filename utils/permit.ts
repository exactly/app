import { type Chain, mainnet, optimism, goerli } from 'wagmi/chains';

const permitAllowed: Record<Chain['id'], string[]> = {
  [mainnet.id]: [],
  [optimism.id]: ['OP'],
  [goerli.id]: ['wstETH'],
};

export function isPermitAllowed(chain: Chain, asset: string): boolean {
  return Boolean(permitAllowed[chain.id]?.includes(asset));
}
