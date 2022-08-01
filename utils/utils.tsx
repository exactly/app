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
      '0xaa82c12e87373dd9ea622fea84100c2f28c7a4d4': 'DAI',
      '0x1fb3d1836c8a7e66e5da6459392b5d6ee09f743b': 'WETH',
      '0xd135e2d232f5b14bc21b8ddba45190e3f5fcf9b0': 'WBTC',
      '0x80f755f7d6de6a67691858a433a128d71e3e65bc': 'USDC'
    }
  };

  return dictionary[currentNetwork!.toLowerCase()]
    ? dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()]
    : 'DAI';
}
