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
      '0xdbefd898fd00e6e06a4c6da8f430f26f7ed9beae': 'DAI',
      '0xe4476d8803a01fe1bf1e51df545300b7bf7f30f2': 'WETH',
      '0x640117781c6ed9e80fc12146cac1df7b9a0e939b': 'WBTC',
      '0x3281ae2c8580d54fc609e008fefae97d76272777': 'USDC'
    }
  };

  return dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()];
}
