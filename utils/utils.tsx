import { Dictionary } from 'types/Dictionary';
import { UnderlyingNetwork } from 'types/Underlying';

import rinkebyDAI from 'protocol/deployments/rinkeby/DAI.json';
import rinkebyWETH from 'protocol/deployments/rinkeby/WETH.json';
import rinkebyWBTC from 'protocol/deployments/rinkeby/WBTC.json';
import rinkebyUSDC from 'protocol/deployments/rinkeby/USDC.json';

import rinkebyFixedLenderDAI from 'protocol/deployments/rinkeby/MarketDAI.json';
import rinkebyFixedLenderWETH from 'protocol/deployments/rinkeby/MarketWETH.json';
import rinkebyFixedLenderWBTC from 'protocol/deployments/rinkeby/MarketWBTC.json';
import rinkebyFixedLenderUSDC from 'protocol/deployments/rinkeby/MarketUSDC.json';

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
      [rinkebyFixedLenderDAI.address.toLowerCase()]: 'DAI',
      [rinkebyFixedLenderWETH.address.toLowerCase()]: 'WETH',
      [rinkebyFixedLenderWBTC.address.toLowerCase()]: 'WBTC',
      [rinkebyFixedLenderUSDC.address.toLowerCase()]: 'USDC'
    }
  };

  return dictionary[currentNetwork!.toLowerCase()]
    ? dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()]
    : 'DAI';
}
