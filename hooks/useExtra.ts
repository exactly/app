import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import { useExtraFinanceLendingGetReserveStatus } from 'types/abi';
import { aprToAPY, toPercentage } from 'utils/utils';
import { optimism } from 'wagmi/chains';

const EXA_RESERVE_ID = 50n;
const COMPOUNDING_INTERVAL = 60n * 60n * 24n;
const LENDING_CONTRACT_ADDRESS = '0xBB505c54D71E9e599cB8435b4F0cEEc05fC71cbD';

export const useExtraDepositAPR = () => {
  const { data: reserves } = useExtraFinanceLendingGetReserveStatus({
    args: [[EXA_RESERVE_ID]],
    address: LENDING_CONTRACT_ADDRESS,
    chainId: optimism.id,
  });
  if (!reserves) return undefined;
  const [{ borrowingRate, totalBorrows, totalLiquidity }] = reserves;
  const utilizationRate = (totalBorrows * WAD) / totalLiquidity;
  return (borrowingRate * utilizationRate) / WAD;
};

export const useExtra = () => {
  const apr = useExtraDepositAPR();
  if (!apr) return { apr: undefined, apy: undefined };
  const apy = aprToAPY(apr, COMPOUNDING_INTERVAL);
  return { apr: toPercentage(Number(apr) / 1e18), apy: toPercentage(Number(apy) / 1e18) };
};
