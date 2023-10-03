import {
  Address,
  parseEther,
  parseUnits,
  createPublicClient,
  http,
  toHex,
  encodeFunctionData,
  pad,
  concat,
  trim,
  createWalletClient,
  isAddress,
  keccak256,
} from 'viem';
import { Chain, optimism } from 'viem/chains';

import type { Coin } from './contracts';
import { erc20 } from './contracts';
import type { ERC20 } from '../../types/contracts';
import { escrowedExaABI } from '../../types/abi';

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env;

if (!TENDERLY_USER || !TENDERLY_PROJECT || !TENDERLY_ACCESS_KEY) {
  throw new Error('Tenderly environment variables not set');
}

const FORK_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Access-Key': TENDERLY_ACCESS_KEY as string,
} as const;

export const rpcURL = (forkId: string) => {
  return `https://rpc.tenderly.co/fork/${forkId}`;
};

export const createFork = async (networkId: number | string = optimism.id): Promise<string> => {
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

export type Tenderly = {
  url: () => string;
  setBalance: (address: Address, balance: Balance) => Promise<void>;
  increaseTime: (timestamp: number) => Promise<void>;
  deleteFork: () => Promise<void>;
};

export const tenderly = async ({ chain = optimism }: { chain: Chain }): Promise<Tenderly> => {
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

  const setEXATokenBalance = async (token: ERC20, address: Address, amount: bigint) => {
    const symbol = await token.read.symbol();

    switch (symbol) {
      case 'EXA': {
        const timelock = '0x92024C4bDa9DA602b711B9AbB610d072018eb58b';
        await walletClient.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: timelock,
              to: token.address,
              data: encodeFunctionData({
                abi: token.abi,
                functionName: 'transfer',
                args: [address, amount],
              }),
            },
          ],
        });

        break;
      }
      case 'esEXA': {
        const exa = await erc20('EXA', { publicClient, walletClient });
        await setEXATokenBalance(exa, address, amount);
        await exa.write.approve([token.address, amount], { account: address, chain });
        await walletClient.writeContract({
          account: address,
          address: token.address,
          abi: escrowedExaABI,
          functionName: 'mint',
          args: [amount, address],
        });

        break;
      }
      default:
        throw new Error('Invalid token');
    }
  };

  const setERC20TokenBalance = async (token: ERC20, address: Address, amount: bigint) => {
    const index = (await token.read.symbol()) === 'WETH' ? '0x3' : '0x0';
    const slot = keccak256(concat([pad(address), pad(index)]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = [token.address, slot, pad(toHex(amount))] as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await walletClient.request({ method: 'tenderly_setStorageAt' as any, params });
  };

  const setOwnedERC20TokenBalance = async (token: ERC20, address: Address, amount: bigint) => {
    let owner = await publicClient.readContract({
      address: token.address,
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

    if ((await token.read.symbol()) === 'USDC') {
      const l2Bridge = await publicClient.getStorageAt({ address: token.address, slot: '0x6' });
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
          to: token.address,
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
            args: [address, amount],
          }),
        },
      ],
    });
  };

  return {
    url: () => url,
    setBalance: async (address: Address, balance: Balance) => {
      for (const symbol of Object.keys(balance) as Array<keyof typeof balance>) {
        const _amount = balance[symbol];
        if (!_amount) return;

        if (symbol === 'ETH') {
          await setNativeBalance(address, _amount);
          return;
        }

        const token = await erc20(symbol, { publicClient });
        const amount = parseUnits(String(_amount), await token.read.decimals());

        switch (symbol) {
          case 'USDC':
          case 'OP':
            await setOwnedERC20TokenBalance(token, address, amount);
            break;

          case 'WETH':
            await setERC20TokenBalance(token, address, amount);
            break;

          case 'EXA':
          case 'esEXA':
            await setEXATokenBalance(token, address, amount);
            break;
        }
      }
    },
    increaseTime: async (timestamp: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await walletClient.request({ method: 'evm_increaseTime' as any, params: [toHex(Math.floor(timestamp))] });
    },
    deleteFork: async () => deleteFork(forkId),
  };
};
