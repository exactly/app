import { hexValue } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import DAI from '@exactly-protocol/protocol/deployments/mainnet/DAI.json';
import USDC from '@exactly-protocol/protocol/deployments/mainnet/USDC.json';
import WBTC from '@exactly-protocol/protocol/deployments/mainnet/WBTC.json';
import wstETH from '@exactly-protocol/protocol/deployments/mainnet/wstETH.json';

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = Cypress.env();

if (!TENDERLY_USER || !TENDERLY_PROJECT || !TENDERLY_ACCESS_KEY) {
  throw new Error('Tenderly environment variables not set');
}

const FORK_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

const HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Access-Key': TENDERLY_ACCESS_KEY as string,
};

type ERC20Token = {
  address: string;
  abi: string;
  decimals: number;
};

const TOKENS: { [key: string]: ERC20Token } = {
  DAI: {
    ...DAI,
    abi: JSON.stringify(DAI.abi),
    decimals: 18,
  },
  USDC: {
    ...USDC,
    abi: JSON.stringify(USDC.abi),
    decimals: 6,
  },
  WBTC: {
    ...WBTC,
    abi: JSON.stringify(WBTC.abi),
    decimals: 8,
  },
  wstETH: {
    ...wstETH,
    abi: JSON.stringify(wstETH.abi),
    decimals: 18,
  },
};

export const createFork = async (networkId = '1', blockNumber = undefined): Promise<string> => {
  const body = JSON.stringify({
    network_id: networkId,
    block_number: blockNumber,
  });

  const rawResponse = await fetch(FORK_URL, { method: 'POST', headers: HEADERS, body });
  const response = await rawResponse.json();
  return response.simulation_fork.id as string;
};

export const deleteFork = async (forkId: string): Promise<void> => {
  const TENDERLY_FORK_API = `${FORK_URL}/${forkId}`;

  await fetch(TENDERLY_FORK_API, { method: 'DELETE', headers: HEADERS });
};

export const rpcURL = (forkId: string) => {
  return `https://rpc.tenderly.co/fork/${forkId}`;
};

export const increaseBalance = async (forkUrl: string, address: string, amount: number) => {
  const provider = new StaticJsonRpcProvider(forkUrl);
  const params = [[address], hexValue(parseFixed(amount.toString(), 18).toHexString())];

  return await provider.send('tenderly_addBalance', params);
};

export const setBalance = async (forkUrl: string, address: string, amount: number) => {
  const provider = new StaticJsonRpcProvider(forkUrl);
  const params = [[address], hexValue(parseFixed(amount.toString(), 18).toHexString())];

  return await provider.send('tenderly_setBalance', params);
};

export const getBalance = async (forkUrl: string, address: string) => {
  const provider = new StaticJsonRpcProvider(forkUrl);
  const params = [address, 'latest'];
  const balance = await provider.send('eth_getBalance', params);

  return formatFixed(balance, 18);
};

const transferERC20 = async (
  forkUrl: string,
  symbol: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
) => {
  const provider = new StaticJsonRpcProvider(forkUrl);
  const signer = provider.getSigner();
  const token = TOKENS[symbol];
  const tokenContract = new Contract(token.address, token.abi, signer);

  const tokenAmount = hexValue(parseFixed(amount.toString(), token.decimals).toHexString());

  await setBalance(forkUrl, fromAddress, 10000);
  const unsignedTx = await tokenContract.populateTransaction.approve(await signer.getAddress(), tokenAmount);
  const transactionParameters = [
    {
      to: tokenContract.address,
      from: fromAddress,
      data: unsignedTx.data,
      gas: hexValue(3000000),
      gasPrice: hexValue(1),
      value: hexValue(0),
    },
  ];

  await provider.send('eth_sendTransaction', transactionParameters);
  await tokenContract.transferFrom(fromAddress, toAddress, tokenAmount);
};

const getTopHolder = async (tokenAddress: string) => {
  return await fetch(`https://api.ethplorer.io/getTopTokenHolders/${tokenAddress}?apiKey=freekey&limit=1`)
    .then((response) => response.json())
    .then((data) => data.holders[0].address);
};

export const transferToken = async (forkUrl: string, address: string, symbol: string, amount: number) => {
  const from = await getTopHolder(TOKENS[symbol].address);
  await transferERC20(forkUrl, symbol, from, address, amount);
};

export const transferAllTokens = async (forkUrl: string, address: string) => {
  await setBalance(forkUrl, address, 1000000);
  for (const symbol of Object.keys(TOKENS)) {
    await transferToken(forkUrl, address, symbol, 1000);
  }
};
