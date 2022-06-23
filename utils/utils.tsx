import { Dictionary } from 'types/Dictionary';
import { UnderlyingNetwork } from 'types/Underlying';

import kovanDAI from 'protocol/deployments/kovan/DAI.json';
import kovanWETH from 'protocol/deployments/kovan/WETH.json';

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
    kovan: {
      '0xf5c62d942cda6861abd96328f53c0ec0c71057d0': 'DAI',
      '0xe233629098f8a09bf8f07140bf57accdcb5caa3f': 'WETH'
    },
    rinkeby: {
      '0x114af308cee2d6b55c3464fdfb13c0607df3c9c5': 'DAI',
      '0x9f275f6d25232fff082082a53c62c6426c1cc94c': 'WETH',
      '0xf710a8d4a88c42d6d341c6e465005f1dcf50726e': 'WBTC',
      '0x69295eac101184f825ef551e0d500b2ad414adbd': 'USDC'
    }
  };

  return dictionary[currentNetwork!.toLowerCase()]
    ? dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()]
    : 'DAI';
}
