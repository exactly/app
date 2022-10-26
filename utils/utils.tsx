import { Dictionary } from 'types/Dictionary';
import { UnderlyingNetwork } from 'types/Underlying';

import goerliDAI from 'protocol/deployments/goerli/DAI.json';
import goerliWETH from 'protocol/deployments/goerli/WETH.json';
import goerliWBTC from 'protocol/deployments/goerli/WBTC.json';
import goerliUSDC from 'protocol/deployments/goerli/USDC.json';
import goerliWSTETH from 'protocol/deployments/goerli/wstETH.json';

import goerliFixedLenderDAI from 'protocol/deployments/goerli/MarketDAI.json';
import goerliFixedLenderWETH from 'protocol/deployments/goerli/MarketWETH.json';
import goerliFixedLenderWBTC from 'protocol/deployments/goerli/MarketWBTC.json';
import goerliFixedLenderUSDC from 'protocol/deployments/goerli/MarketUSDC.json';
import goerliFixedLenderWSTETH from 'protocol/deployments/goerli/MarketwstETH.json';

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
    goerli: {
      dai: {
        address: goerliDAI.address,
        abi: goerliDAI.abi,
      },
      weth: {
        address: goerliWETH.address,
        abi: goerliWETH.abi,
      },
      wbtc: {
        address: goerliWBTC.address,
        abi: goerliWBTC.abi,
      },
      usdc: {
        address: goerliUSDC.address,
        abi: goerliUSDC.abi,
      },
      wsteth: {
        address: goerliWSTETH.address,
        abi: goerliWSTETH.abi,
      },
    },
    mainnet: {},
  };

  return baseData[currentNetwork!.toLowerCase()][symbol.toLowerCase()];
}

export function getSymbol(address: string, network: string | undefined) {
  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const dictionary: Dictionary<Dictionary<string>> = {
    goerli: {
      [goerliFixedLenderDAI.address.toLowerCase()]: 'DAI',
      [goerliFixedLenderWETH.address.toLowerCase()]: 'WETH',
      [goerliFixedLenderWBTC.address.toLowerCase()]: 'WBTC',
      [goerliFixedLenderUSDC.address.toLowerCase()]: 'USDC',
      [goerliFixedLenderWSTETH.address.toLowerCase()]: 'WSTETH',
    },
  };

  return dictionary[currentNetwork!.toLowerCase()]
    ? dictionary[currentNetwork!.toLowerCase()][address.toLowerCase()]
    : 'DAI';
}

export const toPercentage = (value?: number) => {
  if (value != null) {
    return value.toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return 'N/A';
};
