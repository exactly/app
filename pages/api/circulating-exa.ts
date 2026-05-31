import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, getAddress, http, type Address, type ContractFunctionParameters } from 'viem';
import { optimism } from 'viem/chains';
import sablierV2LockupLinearDeployment from '@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json';
import timelockControllerDeployment from '@exactly/protocol/deployments/optimism/TimelockController.json';
import rewardsControllerDeployment from '@exactly/protocol/deployments/optimism/RewardsController.json';
import escrowedEXADeployment from '@exactly/protocol/deployments/optimism/esEXA.json';
import airdropDeployment from '@exactly/protocol/deployments/optimism/Airdrop.json';
import exaDeployment from '@exactly/protocol/deployments/optimism/EXA.json';
import { exaAbi, sablierV2LockupLinearAbi, sablierV2LockupLinearBlock } from '../../generated/wagmi';

const { PRIVATE_ALCHEMY_API_KEY } = process.env;
const client = createPublicClient({
  chain: optimism,
  transport: http(`https://opt-mainnet.g.alchemy.com/v2/${PRIVATE_ALCHEMY_API_KEY}`),
});

const SABLIER_V2_LOCKUP_DYNAMIC = '0x6f68516c21E248cdDfaf4898e66b2b0Adee0e0d6';
const TREASURY = '0x23fD464e0b0eE21cEdEb929B19CABF9bD5215019';
const sablierV2LockupLinear = getAddress(sablierV2LockupLinearDeployment.address);
const timelockController = getAddress(timelockControllerDeployment.address);
const rewardsController = getAddress(rewardsControllerDeployment.address);
const escrowedEXA = getAddress(escrowedEXADeployment.address);
const airdrop = getAddress(airdropDeployment.address);
const exaAddress = getAddress(exaDeployment.address);
const EXCLUDED_ADDRESSES = [
  SABLIER_V2_LOCKUP_DYNAMIC,
  sablierV2LockupLinear,
  timelockController,
  rewardsController,
  escrowedEXA,
  TREASURY,
  airdrop,
] as const satisfies readonly Address[];

const exa = {
  abi: exaAbi,
  address: exaAddress,
} as const;

const sablierLinear = {
  abi: sablierV2LockupLinearAbi,
  address: sablierV2LockupLinear,
} as const;

async function withdrawableFromStreams() {
  const logs = await client.getContractEvents({
    ...sablierLinear,
    eventName: 'CreateLockupLinearStream',
    args: { asset: exaAddress },
    fromBlock: sablierV2LockupLinearBlock[optimism.id],
    strict: true,
  });
  const streamIds = [...new Set(logs.map((log) => log.args.streamId))];
  const contracts = (functionName: 'withdrawableAmountOf' | 'wasCanceled'): ContractFunctionParameters[] =>
    streamIds.map((streamId) => ({ ...sablierLinear, functionName, args: [streamId] }));
  const [amounts, canceled] = await Promise.all([
    client.multicall({ contracts: contracts('withdrawableAmountOf') }),
    client.multicall({ contracts: contracts('wasCanceled') }),
  ]);
  return streamIds.reduce(
    (total, _, index) =>
      amounts[index].status === 'success' && canceled[index].status === 'success' && !canceled[index].result
        ? total + (amounts[index].result as bigint)
        : total,
    0n,
  );
}

export default async function (_: NextApiRequest, res: NextApiResponse) {
  if (!PRIVATE_ALCHEMY_API_KEY) throw new Error('No Alchemy API key');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600');

  try {
    const [decimals, totalSupply, balances, totalWithdrawable] = await Promise.all([
      client.readContract({ ...exa, functionName: 'decimals' }),
      client.readContract({ ...exa, functionName: 'totalSupply' }),
      Promise.all(
        EXCLUDED_ADDRESSES.map((address) =>
          client.readContract({ ...exa, functionName: 'balanceOf', args: [address] }),
        ),
      ),
      withdrawableFromStreams(),
    ]);
    const nonCirculatingSupply = balances.reduce((total, result) => total + result, 0n);
    const circulatingSupply = totalSupply - nonCirculatingSupply + totalWithdrawable;
    res.status(200).json(Number(circulatingSupply) / 10 ** Number(decimals));
  } catch (error) {
    res.status(502).json({ message: 'There was an error fetching the circulating supply' });
    throw error;
  }
}
