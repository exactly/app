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
    '0x188e20546ac8fbdce64f7e166896ff082fc5e055': 'DAI',
    '0xe44fb639bccfb119725d846a3148907f205f5fb2': 'WETH'
  };

  return dictionary[address.toLowerCase()];
}
