import { NextApiRequest, NextApiResponse } from 'next';
import request from 'graphql-request';
import { createPublicClient, getAddress, http, type Address } from 'viem';
import { optimism } from 'viem/chains';
import sablierV2LockupLinearDeployment from '@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json';
import timelockControllerDeployment from '@exactly/protocol/deployments/optimism/TimelockController.json';
import rewardsControllerDeployment from '@exactly/protocol/deployments/optimism/RewardsController.json';
import escrowedEXADeployment from '@exactly/protocol/deployments/optimism/esEXA.json';
import airdropDeployment from '@exactly/protocol/deployments/optimism/Airdrop.json';
import exaDeployment from '@exactly/protocol/deployments/optimism/EXA.json';
import { exaAbi, sablierV2LockupLinearAbi } from '../../generated/wagmi';
import { getStreamsByCategory } from 'queries/getStreamsByCategory';
import networkData from 'config/networkData.json';
import { defaultChain } from 'utils/client';

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

const subgraphUrl = networkData[String(defaultChain.id) as keyof typeof networkData]?.subgraph['sablier'];

async function withdrawableFromCategory(category: 'LockupLinear' | 'LockupDynamic') {
  let last: string | undefined = '';
  let totalWithdrawable = 0n;

  do {
    const query = getStreamsByCategory(exa.address.toLowerCase(), last, category);
    const { streams } = await request<{ streams: Stream[] }>(
      subgraphUrl,
      query,
      {},
      { origin: 'https://app.exact.ly' },
    );
    if (category === 'LockupLinear') {
      const withdrawables = await Promise.all(
        streams.map(({ tokenId }) =>
          client.readContract({
            ...sablierLinear,
            functionName: 'withdrawableAmountOf',
            args: [BigInt(tokenId)],
          }),
        ),
      );
      totalWithdrawable += withdrawables.reduce((total, result) => total + result, 0n);
    }
    last = streams.length ? streams[streams.length - 1].id : undefined;
  } while (last);
  return totalWithdrawable;
}

type Stream = {
  id: string;
  tokenId: string;
};

export default async function (_: NextApiRequest, res: NextApiResponse) {
  if (!PRIVATE_ALCHEMY_API_KEY) throw new Error('No Alchemy API key');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600');

  try {
    const [decimals, totalSupply, balances] = await Promise.all([
      client.readContract({ ...exa, functionName: 'decimals' }),
      client.readContract({ ...exa, functionName: 'totalSupply' }),
      Promise.all(
        EXCLUDED_ADDRESSES.map((address) =>
          client.readContract({ ...exa, functionName: 'balanceOf', args: [address] }),
        ),
      ),
    ]);
    const totalWithdrawable = await withdrawableFromCategory('LockupLinear');
    const nonCirculatingSupply = balances.reduce((total, result) => total + result, 0n);
    const circulatingSupply = totalSupply - nonCirculatingSupply + totalWithdrawable;
    res.status(200).json(Number(circulatingSupply) / 10 ** Number(decimals));
  } catch (error) {
    res.status(502).json({ message: 'There was an error fetching the circulating supply' });
    throw error;
  }
}
