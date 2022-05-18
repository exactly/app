import { Dictionary } from 'types/Dictionary';
import { UnderlyingNetwork } from 'types/Underlying';

import DAI from 'protocol/deployments/kovan/DAI.json';
import WETH from 'protocol/deployments/kovan/WETH.json';

export function transformClasses(style: any, classes: string) {
  if (!style) return 'style object is mandatory';

  const arr = classes?.split(' ') ?? [];
  return arr
    .map((val) => {
      return style[val] ?? '';
    })
    .join(' ');
}

export function formatWallet(walletAddress: String) {
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}

export function getUnderlyingData(network: string | undefined, symbol: string | undefined) {
  if (!network || !symbol) return;

  const baseData: UnderlyingNetwork = {
    kovan: {
      dai: {
        address: DAI.address,
        abi: DAI.abi
      },
      weth: {
        address: WETH.address,
        abi: WETH.abi
      }
    },
    mainnet: {}
  };

  return baseData[network.toLowerCase()][symbol.toLowerCase()];
}

export function getSymbol(address: string) {
  const dictionary: Dictionary<string> = {
    '0xcac4d1ca0e395cfeca89fbb196d60cae8f0193da': 'DAI',
    '0xb160ac4da4f5425f876d741b61898d7e52f0ebe2': 'WETH'
  };

  return dictionary[address.toLowerCase()];
}
