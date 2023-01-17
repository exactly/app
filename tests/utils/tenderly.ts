import { ethers } from 'ethers';
import DAI from '@exactly-protocol/protocol/deployments/mainnet/DAI.json' assert { type: 'json' };
import USDC from '@exactly-protocol/protocol/deployments/mainnet/USDC.json' assert { type: 'json' };
import WBTC from '@exactly-protocol/protocol/deployments/mainnet/WBTC.json' assert { type: 'json' };
import wstETH from '@exactly-protocol/protocol/deployments/mainnet/wstETH.json' assert { type: 'json' };

const constants = {
  TENDERLY_USER: process.env.NEXT_PUBLIC_TENDERLY_USER,
  TENDERLY_PROJECT: process.env.NEXT_PUBLIC_TENDERLY_PROJECT,
  TENDERLY_ACCESS_KEY: process.env.NEXT_PUBLIC_TENDERLY_ACCESS_KEY,
};

export const simulateTx = async () => {
  const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = constants;
  const SIMULATE_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`;

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Access-Key': TENDERLY_ACCESS_KEY as string,
  };

  const body = JSON.stringify({
    // standard TX fields
    network_id: '1',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x0000000000000000000000000000000000000000',
    input: '0x0000000000000000000000000000000000000000',
    gas: 21204,
    gas_price: '0',
    value: 0,
    // simulation config (tenderly specific)
    save_if_fails: false, // TODO: maybe set to true in the future
    save: false,
    simulation_type: 'quick',
  });

  const rawResponse = await fetch(SIMULATE_URL, { method: 'POST', headers, body });
  const response = await rawResponse.json();
  return response;
};

export const createFork = async (networkId = '1', blockNumber = 14386016) => {
  const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = constants;
  const TENDERLY_FORK_API = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/fork`;

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Access-Key': TENDERLY_ACCESS_KEY as string,
  };

  const body = JSON.stringify({
    network_id: networkId,
    block_number: blockNumber,
  });

  const rawResponse = await fetch(TENDERLY_FORK_API, { method: 'POST', headers, body });
  const response = await rawResponse.json();
  return response;
};

export const increaseBalance = async (address: string, amount: number) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new ethers.providers.JsonRpcProvider(forkRPC);
  const params = [[address], ethers.utils.hexValue(ethers.utils.parseUnits(amount.toString(), 'ether').toHexString())];

  return await provider.send('tenderly_addBalance', params);
};

export const setBalance = async (address: string, amount: number) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new ethers.providers.JsonRpcProvider(forkRPC);
  const params = [[address], ethers.utils.hexValue(ethers.utils.parseUnits(amount.toString(), 'ether').toHexString())];

  return await provider.send('tenderly_setBalance', params);
};

export const getBalance = async (address: string) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new ethers.providers.JsonRpcProvider(forkRPC);
  const params = [address, 'latest'];
  const balance = await provider.send('eth_getBalance', params);

  return ethers.utils.formatEther(balance);
};

const transferToken = async (
  tokenAddress: string,
  tokenAbi: string,
  units: number,
  fromAddress: string,
  toAddress: string,
  amount: number,
) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new ethers.providers.JsonRpcProvider(forkRPC);
  const signer = provider.getSigner();
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

  const tokenAmount = ethers.utils.hexValue(ethers.utils.parseUnits(amount.toString(), units).toHexString());

  await setBalance(fromAddress, 10000);
  const unsignedTx = await tokenContract.populateTransaction.approve(await signer.getAddress(), tokenAmount);
  const transactionParameters = [
    {
      to: tokenContract.address,
      from: fromAddress,
      data: unsignedTx.data,
      gas: ethers.utils.hexValue(3000000),
      gasPrice: ethers.utils.hexValue(1),
      value: ethers.utils.hexValue(0),
    },
  ];

  await provider.send('eth_sendTransaction', transactionParameters);
  await tokenContract.transferFrom(fromAddress, toAddress, tokenAmount);
};

export const transferDAI = async (address: string, amount: number) => {
  await transferToken(
    DAI.address,
    JSON.stringify(DAI.abi),
    18,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    address,
    amount,
  );
};

export const transferUSDC = async (address: string, amount: number) => {
  await transferToken(
    USDC.address,
    JSON.stringify(USDC.abi),
    6,
    '0xdcef968d416a41cdac0ed8702fac8128a64241a2',
    address,
    amount,
  );
};

export const transferWBTC = async (address: string, amount: number) => {
  await transferToken(
    WBTC.address,
    JSON.stringify(WBTC.abi),
    8,
    '0x218B95BE3ed99141b0144Dba6cE88807c4AD7C09',
    address,
    amount,
  );
};

export const transferWstETH = async (address: string, amount: number) => {
  await transferToken(
    wstETH.address,
    JSON.stringify(wstETH.abi),
    18,
    '0x10cd5fbe1b404b7e19ef964b63939907bdaf42e2',
    address,
    amount,
  );
};

export const transferAllTokens = async (address: string) => {
  await setBalance(address, 1000000);
  await transferDAI(address, 10000);
  await transferUSDC(address, 10000);
  await transferWBTC(address, 10000);
  await transferWstETH(address, 10000);
};
