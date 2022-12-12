import { UnderlyingNetwork } from 'types/Underlying';

import goerliDAI from '@exactly-protocol/protocol/deployments/goerli/DAI.json';
import goerliWETH from '@exactly-protocol/protocol/deployments/goerli/WETH.json';
import goerliWBTC from '@exactly-protocol/protocol/deployments/goerli/WBTC.json';
import goerliUSDC from '@exactly-protocol/protocol/deployments/goerli/USDC.json';
import goerliWSTETH from '@exactly-protocol/protocol/deployments/goerli/wstETH.json';

import mainnetDAI from '@exactly-protocol/protocol/deployments/mainnet/DAI.json';
import mainnetWETH from '@exactly-protocol/protocol/deployments/mainnet/WETH.json';
import mainnetWBTC from '@exactly-protocol/protocol/deployments/mainnet/WBTC.json';
import mainnetUSDC from '@exactly-protocol/protocol/deployments/mainnet/USDC.json';
import mainnetWSTETH from '@exactly-protocol/protocol/deployments/mainnet/wstETH.json';

export function transformClasses(style: any, classes: string) {
  if (!style) return 'style object is mandatory';

  const arr = classes?.split(' ') ?? [];
  return arr
    .map((val) => {
      return style[val] ?? '';
    })
    .join(' ');
}

export function formatWallet(walletAddress: string) {
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}

export function getUnderlyingData(network: string | undefined, symbol: string | undefined) {
  if (!symbol) return;

  const currentNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

  const baseData: UnderlyingNetwork = {
    goerli: {
      DAI: {
        address: goerliDAI.address,
        abi: goerliDAI.abi,
      },
      WETH: {
        address: goerliWETH.address,
        abi: goerliWETH.abi,
      },
      WBTC: {
        address: goerliWBTC.address,
        abi: goerliWBTC.abi,
      },
      USDC: {
        address: goerliUSDC.address,
        abi: goerliUSDC.abi,
      },
      wstETH: {
        address: goerliWSTETH.address,
        abi: goerliWSTETH.abi,
      },
    },
    mainnet: {
      DAI: {
        address: mainnetDAI.address,
        abi: mainnetDAI.abi,
      },
      WETH: {
        address: mainnetWETH.address,
        abi: mainnetWETH.abi,
      },
      WBTC: {
        address: mainnetWBTC.address,
        abi: mainnetWBTC.abi,
      },
      USDC: {
        address: mainnetUSDC.address,
        abi: mainnetUSDC.abi,
      },
      wstETH: {
        address: mainnetWSTETH.address,
        abi: mainnetWSTETH.abi,
      },
    },
    homestead: {
      // HACK - remove this name and use chainId instead of network names
      DAI: {
        address: mainnetDAI.address,
        abi: mainnetDAI.abi,
      },
      WETH: {
        address: mainnetWETH.address,
        abi: mainnetWETH.abi,
      },
      WBTC: {
        address: mainnetWBTC.address,
        abi: mainnetWBTC.abi,
      },
      USDC: {
        address: mainnetUSDC.address,
        abi: mainnetUSDC.abi,
      },
      wstETH: {
        address: mainnetWSTETH.address,
        abi: mainnetWSTETH.abi,
      },
    },
  };

  return baseData[currentNetwork!.toLowerCase()][symbol];
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
