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

export function getUnderlyingData(
  network: string | undefined = 'kovan',
  symbol: string | undefined
) {
  if (!network || !symbol) return;

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

  return baseData[network.toLowerCase()][symbol.toLowerCase()];
}

export function getSymbol(address: string, network: string = 'kovan') {
  const dictionary: Dictionary<Dictionary<string>> = {
    kovan: {
      '0xcac4d1ca0e395cfeca89fbb196d60cae8f0193da': 'DAI',
      '0xb160ac4da4f5425f876d741b61898d7e52f0ebe2': 'WETH'
    },
    rinkeby: {
      '0xc1fe172c03e63c6e35aee32e33a3326064ef7590': 'DAI',
      '0xc1034988cc35c964d1d6c71e06f7c6f1cc315670': 'WETH'
    }
  };

  return dictionary[network.toLowerCase()][address.toLowerCase()];
}
