import data from 'data/underlying.json'
import axios from 'axios';

type Underlyings = {
  [id: string]: Underlying
}

type Underlying = {
  [id: string]: string
}

export function transformClasses(style: any, classes: string) {
  if (!style) return 'style object is mandatory';

  const arr = classes?.split(' ') ?? [];
  return arr
    .map((val) => {
      return style[val] ?? '';
    })
    .join(' ');
}

export async function getContractsByEnv() {
  const env = process?.env?.NET ?? 'local';

  let auditor, fixedLender;

  if (env == 'local') {
    auditor = require(`contracts/${env}/auditor.json`);
    fixedLender = require(`contracts/${env}/exafin.json`);
  } else {
    const getContracts = await axios.get('https://abi-versions.s3.amazonaws.com/latest/addresses.json');
    const contractsData = getContracts.data;

    console.log(contractsData);

    auditor = contractsData['auditor']
    fixedLender = contractsData['fixedLenderDAI'];
  }

  return {
    auditor,
    fixedLender
  };
}

export function getUnderlyingByEnv(underlying: string) {
  const env: string = process?.env?.NET ?? 'local';
  const underlyings: Underlyings = data;

  return underlyings[env][underlying.toLowerCase()];
}

export function formatWallet(walletAddress: String) {
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
}
