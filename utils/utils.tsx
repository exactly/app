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
    '0xccf0878613d81ee9636472b76efa9e19c30c2cbe': 'DAI',
    '0x0f5f45e9788723a1a3d13d0107b99179924a6691': 'WETH'
  };

  return dictionary[address];
}
