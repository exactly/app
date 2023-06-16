import { Address, parseEther, parseUnits, createPublicClient, http, toHex, encodeFunctionData } from 'viem';
import { Chain, mainnet } from 'viem/chains';

import type { Coin, ERC20TokenSymbol } from './contracts';
import { erc20 } from './contracts';

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = Cypress.env();

if (!TENDERLY_USER || !TENDERLY_PROJECT || !TENDERLY_ACCESS_KEY) {
  throw new Error('Tenderly environment variables not set');
}

const FORK_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Access-Key': TENDERLY_ACCESS_KEY as string,
} as const;

export type Tenderly = {
  url: () => string;
  setBalance: (address: Address, balance: Balance) => Promise<void>;
  deleteFork: () => Promise<void>;
};

export const rpcURL = (forkId: string) => {
  return `https://rpc.tenderly.co/fork/${forkId}`;
};

export const createFork = async (networkId: number | string = mainnet.id): Promise<string> => {
  const body = JSON.stringify({
    network_id: String(networkId),
  });

  const rawResponse = await fetch(FORK_URL, { method: 'POST', headers, body });
  const response = await rawResponse.json();
  return response.simulation_fork.id as string;
};

export const deleteFork = async (forkId: string): Promise<void> => {
  const TENDERLY_FORK_API = `${FORK_URL}/${forkId}`;

  await fetch(TENDERLY_FORK_API, { method: 'DELETE', headers });
};

const getTopHolder = async (tokenAddress: string) => {
  return await fetch(`https://api.ethplorer.io/getTopTokenHolders/${tokenAddress}?apiKey=freekey&limit=1`)
    .then((response) => response.json())
    .then((data) => data.holders[0].address);
};

export type Balance = {
  [key in Coin]?: number;
};

export const tenderly = async ({ chain = mainnet }: { chain: Chain }): Promise<Tenderly> => {
  const forkId = await createFork(chain.id);
  const url = rpcURL(forkId);

  const publicClient = createPublicClient({ chain, transport: http(url) });

  const setNativeBalance = async (address: string, amount: number) => {
    const params = [[address], toHex(parseEther(String(amount) as `${number}`))];
    return await publicClient.request({ method: 'tenderly_setBalance', params });
  };

  const setERC20TokenBalance = async (address: Address, symbol: ERC20TokenSymbol, amount: number) => {
    const token = await erc20(symbol);
    const from = await getTopHolder(token.address);
    await transferERC20(symbol, from, address, amount);
  };

  const transferERC20 = async (symbol: ERC20TokenSymbol, fromAddress: Address, toAddress: Address, amount: number) => {
    await setNativeBalance(fromAddress, 10);

    const tokenContract = await erc20(symbol, { publicClient });
    const tokenAmount = parseUnits(String(amount) as `${number}`, await tokenContract.read.decimals());

    const data = encodeFunctionData({
      abi: tokenContract.abi,
      functionName: 'transfer',
      args: [toAddress, tokenAmount],
    });

    await publicClient.request({
      method: 'eth_sendTransaction',
      params: [{ from: fromAddress, to: tokenContract.address, data }],
    });
  };

  return {
    url: () => url,
    setBalance: async (address: Address, balance: Balance) => {
      for (const symbol of Object.keys(balance) as Array<keyof typeof balance>) {
        switch (symbol) {
          case 'ETH':
            await setNativeBalance(address, balance[symbol]);
            break;
          default:
            await setERC20TokenBalance(address, symbol, balance[symbol]);
        }
      }
    },
    deleteFork: async () => deleteFork(forkId),
  };
};
