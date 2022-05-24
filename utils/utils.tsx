import { Dictionary } from 'types/Dictionary';
import { UnderlyingNetwork } from 'types/Underlying';

import kovanDAI from 'protocol/deployments/kovan/DAI.json';
import kovanWETH from 'protocol/deployments/kovan/WETH.json';
import rinkebyDAI from 'protocol/deployments/rinkeby/DAI.json';
import rinkebyWETH from 'protocol/deployments/rinkeby/WETH.json';

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
  if (!symbol) return;

  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const baseData: UnderlyingNetwork = {
    kovan: {
      dai: {
        address: kovanDAI.address,
        abi: kovanDAI.abi
      },
      weth: {
        address: kovanWETH.address,
        abi: kovanWETH.abi
      }
    },
    rinkeby: {
      dai: {
        address: rinkebyDAI.address,
        abi: rinkebyDAI.abi
      },
      weth: {
        address: rinkebyWETH.address,
        abi: rinkebyWETH.abi
      }
    },
    mainnet: {}
  };

  return baseData[currentNetwork!.toLowerCase()][symbol.toLowerCase()];
}

export function getSymbol(address: string, network: string | undefined) {
  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const dictionary: Dictionary<Dictionary<string>> = {
    kovan: {
      '0x19eeebe4c4b3eb6ca36da09809d387efda807e25': 'DAI',
      '0xe64021ba8661d5902a2838adc77dd43ab4a2fd82': 'WETH'
    },
    rinkeby: {
      '0xc1fe172c03e63c6e35aee32e33a3326064ef7590': 'DAI',
      '0xc1034988cc35c964d1d6c71e06f7c6f1cc315670': 'WETH'
    }
  };

  return dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()];
}
