'use client';

import { useCallback, useMemo, useState } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { Operation } from 'contexts/ModalStatusContext';
import interestRateCurve from 'utils/interestRateCurve';
import queryRates from 'utils/queryRates';
import useAccountData from './useAccountData';
import useDelayedEffect from './useDelayedEffect';
import { useWeb3 } from './useWeb3';

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
  const [depositAPR, setDepositAPR] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  const borrowAPR = useMemo((): number | undefined => {
    if (!marketAccount) return undefined;
    const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = marketAccount;

    const decimalWAD = parseFixed('1', decimals);
    const delta = parseFixed(qty || '0', decimals);

    const deposited = totalFloatingDepositAssets ?? Zero;
    const borrowed = (totalFloatingBorrowAssets ?? Zero).add(delta);

    const t = borrowed.mul(decimalWAD).div(deposited);
    const toUtilization = Number(formatFixed(t, decimals));

    const { interestRateModel } = marketAccount;
    const { A, B, UMax } = {
      A: interestRateModel.floatingCurveA,
      B: interestRateModel.floatingCurveB,
      UMax: interestRateModel.floatingMaxUtilization,
    };

    const curve = interestRateCurve(Number(A) / 1e18, Number(B) / 1e18, Number(UMax) / 1e18);
    const rate = curve(toUtilization);

    return rate;
  }, [marketAccount, qty]);

  const fetchAPRs = useCallback(
    async (cancelled: () => boolean) => {
      if (operation === 'borrow') return;
      setLoading(true);

      if (!marketAccount || !chain) return setDepositAPR(undefined);

      try {
        const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
        if (!subgraphUrl) return;
        const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, marketAccount.market, 'deposit', {
          maxFuturePools: marketAccount.maxFuturePools,
        });

        if (cancelled()) return;
        const { totalFloatingDepositAssets, decimals } = marketAccount;

        const futureSupply = totalFloatingDepositAssets.add(parseFixed(qty || '0', decimals));
        const ratio = Number(totalFloatingDepositAssets.mul(WeiPerEther).div(futureSupply)) / 1e18;
        const finalAPR = ratio * depositAPRRate;

        setDepositAPR(finalAPR);
        setLoading(false);
      } catch {
        setDepositAPR(undefined);
      }
    },
    [operation, marketAccount, chain, qty],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: fetchAPRs });

  return {
    depositAPR,
    borrowAPR,
    loading: loading || delayedLoading,
  };
};
