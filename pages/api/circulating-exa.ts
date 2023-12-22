import { NextApiRequest, NextApiResponse } from 'next';
import request from 'graphql-request';
import { createPublicClient, getAddress, http } from 'viem';
import { optimism } from 'viem/chains';
import { address as sablierV2LockupLinear } from '@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json';
import { address as timelockController } from '@exactly/protocol/deployments/optimism/TimelockController.json';
import { address as rewardsController } from '@exactly/protocol/deployments/optimism/RewardsController.json';
import { address as escrowedEXA } from '@exactly/protocol/deployments/optimism/esEXA.json';
import { address as airdrop } from '@exactly/protocol/deployments/optimism/Airdrop.json';
import { address as exaAddress } from '@exactly/protocol/deployments/optimism/EXA.json';
import { exaABI, sablierV2LockupLinearABI } from '../../types/abi';
import { getStreamsByCategory } from 'queries/getStreamsByCategory';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { defaultChain } from 'utils/client';

const { PRIVATE_ALCHEMY_API_KEY } = process.env;
const client = createPublicClient({
  chain: optimism,
  transport: http(`https://opt-mainnet.g.alchemy.com/v2/${PRIVATE_ALCHEMY_API_KEY}`),
});

const SABLIER_V2_LOCKUP_DYNAMIC = '0x6f68516c21E248cdDfaf4898e66b2b0Adee0e0d6';
const TREASURY = '0x23fD464e0b0eE21cEdEb929B19CABF9bD5215019';
const EXCLUDED_ADDRESSES = [
  SABLIER_V2_LOCKUP_DYNAMIC,
  sablierV2LockupLinear,
  timelockController,
  rewardsController,
  escrowedEXA,
  TREASURY,
  airdrop,
];

const exa = {
  abi: exaABI,
  address: getAddress(exaAddress),
} as const;

const sablierLinear = {
  abi: sablierV2LockupLinearABI,
  address: getAddress(sablierV2LockupLinear),
} as const;

const subgraphUrl = networkData[String(defaultChain.id) as keyof typeof networkData]?.subgraph['sablier'];

async function withdrawableFromCategory(category: 'LockupLinear' | 'LockupDynamic') {
  let last: string | undefined = '';
  let totalWithdrawable = 0n;

  do {
    const query = getStreamsByCategory(exa.address.toLowerCase(), last, category);
    const { streams } = await request<{ streams: Stream[] }>(subgraphUrl, query);
    if (category === 'LockupLinear') {
      totalWithdrawable += (
        await client.multicall({
          contracts: [
            ...streams.map(({ tokenId }) => ({
              ...sablierLinear,
              functionName: 'withdrawableAmountOf',
              args: [tokenId],
            })),
          ],
        })
      ).reduce((total, { result }) => total + (result as bigint), 0n);
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
    const [{ result: decimals }, { result: totalSupply }, ...balancesResult] = await client.multicall({
      contracts: [
        { ...exa, functionName: 'decimals' },
        { ...exa, functionName: 'totalSupply' },
        ...EXCLUDED_ADDRESSES.map((address) => ({ ...exa, functionName: 'balanceOf', args: [address] })),
      ],
    });
    const totalWithdrawable = await withdrawableFromCategory('LockupLinear');
    const nonCirculatingSupply = balancesResult.reduce((total, { result }) => total + (result as bigint), 0n);
    const circulatingSupply = (totalSupply as bigint) - nonCirculatingSupply + totalWithdrawable;
    res.status(200).json(Number(circulatingSupply) / 10 ** Number(decimals));
  } catch (error) {
    res.status(502).json({ message: 'There was an error fetching the circulating supply' });
    throw error;
  }
}
