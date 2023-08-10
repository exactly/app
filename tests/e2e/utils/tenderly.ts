import {
  Address,
  parseEther,
  parseUnits,
  createPublicClient,
  http,
  toHex,
  encodeFunctionData,
  pad,
  trim,
  createWalletClient,
  isAddress,
} from 'viem';
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

export type Balance = {
  [key in Coin]?: number;
};

export const tenderly = async ({ chain = mainnet }: { chain: Chain }): Promise<Tenderly> => {
  const forkId = await createFork(chain.id);
  const url = rpcURL(forkId);

  const publicClient = createPublicClient({ chain, transport: http(url) });
  const walletClient = createWalletClient({ chain, transport: http(url) });

  const setNativeBalance = async (address: string, amount: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = [[address], toHex(parseEther(String(amount)))] as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await walletClient.request({ method: 'tenderly_setBalance' as any, params });
  };

  const setERC20TokenBalance = async (address: Address, symbol: ERC20TokenSymbol, amount: number) => {
    const tokenContract = await erc20(symbol, { publicClient });
    const tokenAmount = parseUnits(String(amount), await tokenContract.read.decimals());

    let owner = await publicClient.readContract({
      address: tokenContract.address,
      abi: [
        {
          stateMutability: 'view',
          type: 'function',
          inputs: [],
          name: 'owner',
          outputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
        },
      ],
      functionName: 'owner',
    });

    if (symbol === 'USDC') {
      const l2Bridge = await publicClient.getStorageAt({ address: tokenContract.address, slot: '0x6' });
      if (!l2Bridge) throw new Error('L2 bridge not found');
      owner = pad(trim(l2Bridge), { size: 20 });
    }

    const from = String(owner);

    if (!isAddress(from)) {
      throw new Error('Invalid owner address');
    }

    await walletClient.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from,
          to: tokenContract.address,
          data: encodeFunctionData({
            abi: [
              {
                stateMutability: 'nonpayable',
                type: 'function',
                inputs: [
                  { name: 'account', internalType: 'address', type: 'address' },
                  { name: 'amount', internalType: 'uint256', type: 'uint256' },
                ],
                name: 'mint',
                outputs: [],
              },
            ],
            functionName: 'mint',
            args: [address, tokenAmount],
          }),
        },
      ],
    });
  };

  return {
    url: () => url,
    setBalance: async (address: Address, balance: Balance) => {
      for (const symbol of Object.keys(balance) as Array<keyof typeof balance>) {
        const amount = balance[symbol];
        if (!amount) return;
        switch (symbol) {
          case 'ETH':
            await setNativeBalance(address, amount);
            break;
          default:
            await setERC20TokenBalance(address, symbol, amount);
        }
      }
    },
    deleteFork: async () => deleteFork(forkId),
  };
};
