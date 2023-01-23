import { hexValue } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import DAI from '@exactly-protocol/protocol/deployments/mainnet/DAI.json';
import USDC from '@exactly-protocol/protocol/deployments/mainnet/USDC.json';
import WBTC from '@exactly-protocol/protocol/deployments/mainnet/WBTC.json';
import wstETH from '@exactly-protocol/protocol/deployments/mainnet/wstETH.json';

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = Cypress.env();

const FORK_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

const HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Access-Key': TENDERLY_ACCESS_KEY as string,
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

const transferToken = async (
  forkUrl: string,
  tokenAddress: string,
  tokenAbi: string,
  units: number,
  fromAddress: string,
  toAddress: string,
  amount: number,
) => {
  const provider = new StaticJsonRpcProvider(forkUrl);
  const signer = provider.getSigner();
  const tokenContract = new Contract(tokenAddress, tokenAbi, signer);

  const tokenAmount = hexValue(parseFixed(amount.toString(), units).toHexString());

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

export const transferDAI = async (forkUrl: string, address: string, amount: number) => {
  await transferToken(
    forkUrl,
    DAI.address,
    JSON.stringify(DAI.abi),
    18,
    await getTopHolder(DAI.address),
    address,
    amount,
  );
};

export const transferUSDC = async (forkUrl: string, address: string, amount: number) => {
  await transferToken(
    forkUrl,
    USDC.address,
    JSON.stringify(USDC.abi),
    6,
    await getTopHolder(USDC.address),
    address,
    amount,
  );
};

export const transferWBTC = async (forkUrl: string, address: string, amount: number) => {
  await transferToken(
    forkUrl,
    WBTC.address,
    JSON.stringify(WBTC.abi),
    8,
    await getTopHolder(WBTC.address),
    address,
    amount,
  );
};

export const transferWstETH = async (forkUrl: string, address: string, amount: number) => {
  await transferToken(
    forkUrl,
    wstETH.address,
    JSON.stringify(wstETH.abi),
    18,
    await getTopHolder(wstETH.address),
    address,
    amount,
  );
};

export const getTopHolder = async (tokenAddress: string) => {
  return await fetch(`https://api.ethplorer.io/getTopTokenHolders/${tokenAddress}?apiKey=freekey&limit=1`)
    .then((response) => response.json())
    .then((data) => data.holders[0].address);
};

export const transferAllTokens = async (forkUrl: string, address: string) => {
  await setBalance(forkUrl, address, 1000000);
  await transferDAI(forkUrl, address, 1000);
  await transferUSDC(forkUrl, address, 1000);
  await transferWBTC(forkUrl, address, 1000);
  await transferWstETH(forkUrl, address, 1000);
};
