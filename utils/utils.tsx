import { UnderlyingNetwork } from 'types/Underlying';
import DAI from 'protocol/deployments/kovan/DAI.json';
import WETH from 'protocol/deployments/kovan/WETH.json';
import daiAbi from 'contracts/abi/dai.json';

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
        address: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
        abi: daiAbi
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
