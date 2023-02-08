import { captureException } from '@sentry/nextjs';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { useCallback, useEffect, useState } from 'react';
import queryRates from 'utils/queryRates';
import useAccountData from './useAccountData';
import { useWeb3 } from './useWeb3';

type FloatingPoolAPR = {
  depositAPR: number | undefined;
  borrowAPR: number | undefined;
  loading: boolean;
};

export default (symbol: string): FloatingPoolAPR => {
  const { chain } = useWeb3();
  const { floatingBorrowRate, maxFuturePools, market } = useAccountData(symbol);
  const [depositAPR, setDepositAPR] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAPRs = useCallback(async () => {
    if (!maxFuturePools || !market || !chain) return;
    setLoading(true);

    try {
      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
      if (!subgraphUrl) return;
      const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, market, 'deposit', { maxFuturePools });
      setDepositAPR(depositAPRRate);
    } finally {
      setLoading(false);
    }
  }, [maxFuturePools, market, chain]);

  useEffect(() => {
    fetchAPRs().catch(captureException);
  }, [fetchAPRs]);

  return { depositAPR, borrowAPR: floatingBorrowRate ? Number(floatingBorrowRate) / 1e18 : undefined, loading };
};
