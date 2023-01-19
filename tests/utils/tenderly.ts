import { hexValue } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import ERC20 from '@exactly-protocol/protocol/deployments/mainnet/DAI.json' assert { type: 'json' };

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
  const provider = new StaticJsonRpcProvider(forkRPC);
  const params = [[address], hexValue(parseFixed(amount.toString(), 18).toHexString())];

  return await provider.send('tenderly_addBalance', params);
};

export const setBalance = async (address: string, amount: number) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new StaticJsonRpcProvider(forkRPC);
  const params = [[address], hexValue(parseFixed(amount.toString(), 18).toHexString())];

  return await provider.send('tenderly_setBalance', params);
};

export const getBalance = async (address: string) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new StaticJsonRpcProvider(forkRPC);
  const params = [address, 'latest'];
  const balance = await provider.send('eth_getBalance', params);

  return formatFixed(balance, 18);
};

const transferToken = async (tokenAddress: string, units: number, toAddress: string, amount: number) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new StaticJsonRpcProvider(forkRPC);
  const signer = provider.getSigner();
  const tokenContract = new Contract(tokenAddress, ERC20.abi, signer);

  const tokenAmount = hexValue(parseFixed(amount.toString(), units).toHexString());

  await setBalance(tokenAddress, 10000);
  // const unsignedTx = await tokenContract.populateTransaction.approve(await signer.getAddress(), tokenAmount);
  // const transactionParameters = [
  //   {
  //     to: tokenContract.address,
  //     from: fromAddress,
  //     data: unsignedTx.data,
  //     gas: hexValue(3000000),
  //     gasPrice: hexValue(1),
  //     value: hexValue(0),
  //   },
  // ];

  // await provider.send('eth_sendTransaction', transactionParameters);
  await tokenContract.transfer(toAddress, tokenAmount);
};

const mintToken = async (tokenAddress: string, tokenAbi: string, units: number, toAddress: string, amount: number) => {
  const forkId = 'a58acb82-0ddf-4e31-90c3-1c37ddfd2c9e';
  const forkRPC = `https://rpc.tenderly.co/fork/${forkId}`;
  const provider = new StaticJsonRpcProvider(forkRPC);
  const signer = provider.getSigner();
  const tokenContract = new Contract(tokenAddress, tokenAbi, signer);

  const tokenAmount = hexValue(parseFixed(amount.toString(), units).toHexString());

  await setBalance(tokenAddress, 10000);
  // const unsignedTx = await tokenContract.populateTransaction.approve(await signer.getAddress(), tokenAmount);
  // const transactionParameters = [
  //   {
  //     to: tokenContract.address,
  //     from: tokenAddress,
  //     data: unsignedTx.data,
  //     gas: hexValue(3000000),
  //     gasPrice: hexValue(1),
  //     value: hexValue(0),
  //   },
  // ];

  // await provider.send('eth_sendTransaction', transactionParameters);
  await tokenContract.mint(toAddress, tokenAmount);
};

export const transferDAI = async (address: string, amount: number) => {
  await transferToken(
    DAI.address,
    '[{"inputs":[{"internalType":"uint256","name":"chainId_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"guy","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":true,"internalType":"address","name":"usr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"arg1","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"arg2","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"dst","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"deny","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"move","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"pull","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"push","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"rely","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"wards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]',
    18,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    address,
    amount,
  );
};

export const mintDAI = async (address: string, amount: number) => {
  await mintToken(
    DAI.address,
    '[{"inputs":[{"internalType":"uint256","name":"chainId_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"guy","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":true,"internalType":"address","name":"usr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"arg1","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"arg2","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"dst","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"deny","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"move","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"pull","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"push","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"rely","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"wards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]',
    18,
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
