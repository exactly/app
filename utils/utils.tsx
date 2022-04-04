import { UnderlyingNetwork } from 'types/Underlying';
import daiAbi from 'contracts/abi/dai.json';
import wethAbi from 'contracts/abi/weth.json';
import { ethers } from 'ethers';

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

export function getUnderlyingData(network: string | undefined, symbol: string | undefined) {
  if (!network || !symbol) return;

  const baseData: UnderlyingNetwork = {
    kovan: {
      dai: {
        address: '0x3b89713BB731D9263FeD4b72a9B01B629a584cC7',
        abi: daiAbi
      },
      usdc: { address: '0xdcfab8057d08634279f8201b55d311c2a67897d2', abi: '' },
      usdt: { address: '0xf3e0d7bf58c5d455d31ef1c2d5375904df525105', abi: '' },
      weth: {
        address: '0x37ef4ad938E01640156AC0d5D4e7656891949F04',
        abi: wethAbi
      }
    },
    rinkeby: {},
    mainnet: {}
  };

  return baseData[network.toLowerCase()][symbol.toLowerCase()];
}

export async function getMetamaskAccounts() {
  const hasMetamask = await isMetamaskInstalled();
  if (hasMetamask) {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    const accounts = await provider.listAccounts();

    return accounts ?? [];
  } else {
    return [];
  }
}

export async function handleMetamaskLogin() {
  try {
    const hasMetamask = await isMetamaskInstalled();
    if (hasMetamask) {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      return accounts ?? [];
    } else {
      //TODO: Lets ask the design team for a modal to handle this
      alert('Please install metamask');
    }
  } catch (err: unknown) {
    console.log(err);
  }
}

export async function isMetamaskInstalled() {
  return window.ethereum ? true : false;
}

export async function getChainId() {
  const hasMetamask = await isMetamaskInstalled();
  if (!hasMetamask) return false;

  return await window.ethereum.request({ method: 'eth_chainId' });
}
