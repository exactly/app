import { useCallback, useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import networkData from 'config/networkData.json' assert { type: 'json' };
import type { Operation } from 'types/Operation';
import { floatingInterestRateCurve, globalUtilization, floatingUtilization } from 'utils/interestRateCurve';
import queryRates from 'utils/queryRates';
import useAccountData from './useAccountData';
import useDelayedEffect from './useDelayedEffect';
import { useWeb3 } from './useWeb3';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import { WEI_PER_ETHER } from 'utils/const';
import { useMarketFloatingBackupBorrowed } from 'types/abi';

type FloatingPoolAPR = {
  depositAPR: number | undefined;
  borrowAPR: number | undefined;
  loading: boolean;
};

export default (
  symbol: string,
  qty?: string,
  operation?: Extract<Operation, 'deposit' | 'borrow'>,
): FloatingPoolAPR => {
  const { chain } = useWeb3();
  const { marketAccount } = useAccountData(symbol);
  const { data: floatingBackupBorrowed } = useMarketFloatingBackupBorrowed({
    address: marketAccount?.market,
    chainId: chain.id,
  });
  const [depositAPR, setDepositAPR] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const { setIndexerError } = useGlobalError();

  const borrowAPR = useMemo((): number | undefined => {
    if (!marketAccount || floatingBackupBorrowed === undefined) {
      return undefined;
    }

    const { interestRateModel, totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = marketAccount;
    const delta = parseUnits(qty || '0', decimals);

    const debt = totalFloatingBorrowAssets + delta;

    const { A, B, uMax } = {
      A: interestRateModel.floatingCurveA,
      B: interestRateModel.floatingCurveB,
      uMax: interestRateModel.floatingMaxUtilization,
    };

    const curve = floatingInterestRateCurve({
      a: A,
      b: B,
      maxUtilization: uMax,
      // TODO
      naturalUtilization: 700000000000000000n,
      sigmoidSpeed: 2500000000000000000n,
      growthSpeed: 1000000000000000000n,
      maxRate: 150000000000000000000n,
    });

    const uF = floatingUtilization(totalFloatingDepositAssets, debt);
    const uG = globalUtilization(totalFloatingDepositAssets, debt, floatingBackupBorrowed);

    return Number(curve(uF, uG)) / 1e18;
  }, [floatingBackupBorrowed, marketAccount, qty]);

  const fetchAPRs = useCallback(
    async (cancelled: () => boolean) => {
      if (operation === 'borrow') return;
      setLoading(true);

      if (!marketAccount || !chain) return setDepositAPR(undefined);

      try {
        const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph.exactly;
        if (!subgraphUrl) return;
        const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, marketAccount.market, 'deposit', {
          maxFuturePools: marketAccount.maxFuturePools,
        });

        if (cancelled()) return;
        const { totalFloatingDepositAssets, decimals } = marketAccount;

        const futureSupply = totalFloatingDepositAssets + parseUnits(qty || '0', decimals);
        const ratio =
          Number(futureSupply === 0n ? 0n : (totalFloatingDepositAssets * WEI_PER_ETHER) / futureSupply) / 1e18;
        const finalAPR = ratio * depositAPRRate;

        setDepositAPR(finalAPR);
        setLoading(false);
      } catch {
        setIndexerError();
        setDepositAPR(undefined);
      }
    },
    [operation, marketAccount, chain, qty, setIndexerError],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: fetchAPRs });

  return {
    depositAPR,
    borrowAPR,
    loading: loading || delayedLoading,
  };
};
