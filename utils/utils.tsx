import { UnderlyingNetwork } from "types/Underlying";

export function transformClasses(style: any, classes: string) {
  if (!style) return 'style object is mandatory';

  const arr = classes?.split(' ') ?? [];
  return arr
    .map((val) => {
      return style[val] ?? '';
    })
    .join(' ');
}

export function getContractsByEnv() {
  const env = process?.env?.NET ?? 'local';

  const auditor = require(`contracts/${env}/auditor.json`);
  const exafin = require(`contracts/${env}/exafin.json`);
  const interestRateModel = require(`contracts/${env}/interestRateModel.json`);

  return {
    auditor,
    exafin,
    interestRateModel
  };
}

export function formatWallet(walletAddress: String) {
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}


export function getUnderlyingAddress(network: string, symbol: string) {
  const baseData: UnderlyingNetwork = {
    "kovan": {
      "dai": "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa",
      "usdc": "0xdcfab8057d08634279f8201b55d311c2a67897d2",
      "usdt": "0xf3e0d7bf58c5d455d31ef1c2d5375904df525105",
      "weth": "0xd0a1e359811322d97991e03f863a0c30c2cf029c"
    },
    "rinkeby": {
      "dai": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    "mainnet": {}
  }

  return baseData[network.toLowerCase()][symbol.toLowerCase()]
}

