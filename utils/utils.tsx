import { Dictionary } from 'types/Dictionary';
import { UnderlyingNetwork } from 'types/Underlying';

import rinkebyDAI from 'protocol/deployments/rinkeby/DAI.json';
import rinkebyWETH from 'protocol/deployments/rinkeby/WETH.json';
import rinkebyWBTC from 'protocol/deployments/rinkeby/WBTC.json';
import rinkebyUSDC from 'protocol/deployments/rinkeby/USDC.json';

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
    rinkeby: {
      dai: {
        address: rinkebyDAI.address,
        abi: rinkebyDAI.abi
      },
      weth: {
        address: rinkebyWETH.address,
        abi: rinkebyWETH.abi
      },
      wbtc: {
        address: rinkebyWBTC.address,
        abi: rinkebyWBTC.abi
      },
      usdc: {
        address: rinkebyUSDC.address,
        abi: rinkebyUSDC.abi
      }
    },
    mainnet: {}
  };

  return baseData[currentNetwork!.toLowerCase()][symbol.toLowerCase()];
}

export function getSymbol(address: string, network: string | undefined) {
  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const dictionary: Dictionary<Dictionary<string>> = {
    rinkeby: {
      '0x46a32241f2753118016c8fb804a12d6094f6bf81': 'DAI',
      '0x594ba496a24b8e6683de356afcbfb7400e3ecae7': 'WETH',
      '0x2d6b5da466fc1523d6377ebc5bb0b52ae440c4ee': 'WBTC',
      '0xd795bb0abc85c32bb7a9f8701729fe39847084fa': 'USDC'
    }
  };

  return dictionary[currentNetwork!.toLowerCase()]
    ? dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()]
    : 'DAI';
}
