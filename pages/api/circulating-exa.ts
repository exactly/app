import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, getAddress, http } from 'viem';
import { optimism } from 'viem/chains';
import { address as sablierV2LockupLinear } from '@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json';
import { address as timelockController } from '@exactly/protocol/deployments/optimism/TimelockController.json';
import { address as rewardsController } from '@exactly/protocol/deployments/optimism/RewardsController.json';
import { address as escrowedEXA } from '@exactly/protocol/deployments/optimism/EscrowedEXA.json';
import { address as airdrop } from '@exactly/protocol/deployments/optimism/Airdrop.json';
import { address as exaAddress } from '@exactly/protocol/deployments/optimism/EXA.json';
import { exaABI } from '../../types/abi';

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

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { PRIVATE_ALCHEMY_API_KEY } = process.env;
  if (!PRIVATE_ALCHEMY_API_KEY) throw new Error('No Alchemy API key');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600');

  const client = createPublicClient({
    chain: optimism,
    transport: http(`https://opt-mainnet.g.alchemy.com/v2/${PRIVATE_ALCHEMY_API_KEY}`),
  });

  const [{ result: decimals }, { result: totalSupply }, ...balancesResult] = await client.multicall({
    contracts: [
      { ...exa, functionName: 'decimals' },
      { ...exa, functionName: 'totalSupply' },
      ...EXCLUDED_ADDRESSES.map((address) => ({ ...exa, functionName: 'balanceOf', args: [address] })),
    ],
  });
  const nonCirculatingSupply = balancesResult.reduce((total, { result }) => total + (result as bigint), 0n);
  const circulatingSupply = (totalSupply as bigint) - nonCirculatingSupply;
  res.status(200).send(String(Number(circulatingSupply) / 10 ** Number(decimals)));
}
