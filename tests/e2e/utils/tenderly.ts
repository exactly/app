import { hexValue } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = Cypress.env();

if (!TENDERLY_USER || !TENDERLY_PROJECT || !TENDERLY_ACCESS_KEY) {
  throw new Error('Tenderly environment variables not set');
}

const FORK_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Access-Key': TENDERLY_ACCESS_KEY as string,
};

type ERC20Token = {
  address: string;
  abi: string;
  decimals: number;
};

const ERC20TokenSymbols = ['DAI', 'USDC', 'WBTC', 'wstETH'] as const;
export type ERC20TokenSymbol = (typeof ERC20TokenSymbols)[number];
export type Coin = ERC20TokenSymbol | 'ETH';

const decimals: Record<Coin, number> = {
  ETH: 18,
  DAI: 18,
  USDC: 6,
  WBTC: 8,
  wstETH: 18,
};

type Tokens = {
  [key in ERC20TokenSymbol]?: ERC20Token;
};

const tokens: Tokens = {};

export const init = async () => {
  for (const symbol of ERC20TokenSymbols) {
    const contract = await import(`@exactly-protocol/protocol/deployments/mainnet/${symbol}.json`);
    console.log(contract);
    tokens[symbol] = {
      ...contract,
      abi: JSON.stringify(contract.abi),
      decimals: decimals[symbol],
    };
  }
};

export const createFork = async (networkId = '1', blockNumber = undefined): Promise<string> => {
  const body = JSON.stringify({
    network_id: networkId,
    block_number: blockNumber,
  });

  const rawResponse = await fetch(FORK_URL, { method: 'POST', headers, body });
  const response = await rawResponse.json();
  return response.simulation_fork.id as string;
};

export const deleteFork = async (forkId: string): Promise<void> => {
  const TENDERLY_FORK_API = `${FORK_URL}/${forkId}`;

  await fetch(TENDERLY_FORK_API, { method: 'DELETE', headers });
};

export const rpcURL = (forkId: string) => {
  return `https://rpc.tenderly.co/fork/${forkId}`;
};

const setNativeBalance = async (forkUrl: string, address: string, amount: number) => {
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
  symbol: ERC20TokenSymbol,
  fromAddress: string,
  toAddress: string,
  amount: number,
) => {
  const provider = new StaticJsonRpcProvider(forkUrl);
  const token = tokens[symbol];
  const signer = provider.getSigner();
  const tokenContract = new Contract(token.address, token.abi, signer);

  const tokenAmount = hexValue(parseFixed(amount.toString(), token.decimals).toHexString());

  await setNativeBalance(forkUrl, fromAddress, 10);
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

const setERC20TokenBalance = async (forkUrl: string, address: string, symbol: ERC20TokenSymbol, amount: number) => {
  const from = await getTopHolder(tokens[symbol].address);
  await transferERC20(forkUrl, symbol, from, address, amount);
};

export type Balance = {
  [key in Coin]?: number;
};

export const setBalance = async (forkUrl: string, address: string, balance: Balance) => {
  for (const symbol of Object.keys(balance) as Array<keyof typeof balance>) {
    switch (symbol) {
      case 'ETH':
        await setNativeBalance(forkUrl, address, balance[symbol]);
        break;
      default:
        await setERC20TokenBalance(forkUrl, address, symbol, balance[symbol]);
    }
  }
};
