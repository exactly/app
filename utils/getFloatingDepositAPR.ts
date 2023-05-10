import networkData from 'config/networkData.json' assert { type: 'json' };
import queryRate from 'utils/queryRates';

export default async function getFloatingDepositAPR(
  chainId: number,
  type: 'deposit',
  maxFuturePools: number,
  eMarketAddress: string,
) {
  const subgraphUrl = networkData[String(chainId) as keyof typeof networkData]?.subgraph;

  if (!subgraphUrl) return;

  const [{ apr }] = await queryRate(subgraphUrl, eMarketAddress, type, { maxFuturePools });
  return apr;
}
