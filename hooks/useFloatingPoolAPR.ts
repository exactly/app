import { useCallback, useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import floatingRate from '@exactly/lib/esm/interest-rate-model/floatingRate';
import floatingUtilization from '@exactly/lib/esm/interest-rate-model/floatingUtilization';
import globalUtilization from '@exactly/lib/esm/interest-rate-model/globalUtilization';

import networkData from 'config/networkData.json' assert { type: 'json' };
import type { Operation } from 'types/Operation';
import queryRates from 'utils/queryRates';
import useAccountData from './useAccountData';
import useDelayedEffect from './useDelayedEffect';
import { useWeb3 } from './useWeb3';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import useIRM from './useIRM';
import { floatingInterestRateCurve } from 'utils/interestRateCurve';
import { mainnet } from 'wagmi';
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

  const irm = useIRM(symbol);

  const [depositAPR, setDepositAPR] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const { setIndexerError } = useGlobalError();

  const { data: _floatingBackupBorrowed } = useMarketFloatingBackupBorrowed({
    address: marketAccount?.market,
    chainId: chain.id,
  });

  const borrowAPR = useMemo((): number | undefined => {
    if (chain.id === mainnet.id) {
      if (!marketAccount || _floatingBackupBorrowed === undefined) {
        return undefined;
      }

      const { interestRateModel, totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = marketAccount;
      const delta = parseUnits(qty || '0', decimals);

      const debt = totalFloatingBorrowAssets + delta;

      const { A, B, uMax } = {
        A: 'floatingCurveA' in interestRateModel && interestRateModel.floatingCurveA,
        B: 'floatingCurveB' in interestRateModel && interestRateModel.floatingCurveB,
        uMax: 'floatingMaxUtilization' in interestRateModel && interestRateModel.floatingMaxUtilization,
      };

      if (!A || !B || !uMax) return undefined;

      const curve = floatingInterestRateCurve({
        A,
        B,
        maxUtilization: uMax,
        naturalUtilization: 700000000000000000n,
        sigmoidSpeed: 2500000000000000000n,
        growthSpeed: 1000000000000000000n,
        maxRate: 150000000000000000000n,
      });

      const uF = floatingUtilization(totalFloatingDepositAssets, debt);
      const uG = globalUtilization(totalFloatingDepositAssets, debt, _floatingBackupBorrowed);

      return Number(curve(uF, uG)) / 1e18;
    } else {
      if (!marketAccount || !irm || operation === 'deposit') {
        return undefined;
      }

      const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals, floatingBackupBorrowed } = marketAccount;
      const delta = parseUnits(qty || '0', decimals);

      const debt = totalFloatingBorrowAssets + delta;

      return (
        Number(
          floatingRate(
            floatingUtilization(totalFloatingDepositAssets, debt),
            globalUtilization(totalFloatingDepositAssets, debt, floatingBackupBorrowed),
            irm,
          ),
        ) / 1e18
      );
    }
  }, [chain.id, marketAccount, _floatingBackupBorrowed, qty, irm, operation]);

  const fetchAPRs = useCallback(
    async (cancelled: () => boolean) => {
      if (operation === 'borrow') return;
      setLoading(true);

      if (!marketAccount) return setDepositAPR(undefined);

      try {
        const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph.exactly;
        if (!subgraphUrl) return;
        const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, marketAccount.market, 'deposit', {
          maxFuturePools: marketAccount.maxFuturePools,
        });

        if (cancelled()) return;
        const { totalFloatingDepositAssets, decimals } = marketAccount;

        const futureSupply = totalFloatingDepositAssets + parseUnits(qty || '0', decimals);
        const ratio = Number(futureSupply === 0n ? 0n : (totalFloatingDepositAssets * WAD) / futureSupply) / 1e18;
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
