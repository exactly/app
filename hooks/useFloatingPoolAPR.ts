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
  const { marketAccount } = useAccountData(symbol);
  const [depositAPR, setDepositAPR] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAPRs = useCallback(async () => {
    setLoading(true);

    if (!marketAccount || !chain) return setDepositAPR(undefined);

    try {
      const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
      if (!subgraphUrl) return;
      const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, marketAccount.market, 'deposit', {
        maxFuturePools: marketAccount.maxFuturePools,
      });
      setDepositAPR(depositAPRRate);
      setLoading(false);
    } catch {
      setDepositAPR(undefined);
    }
  }, [marketAccount, chain]);

  useEffect(() => {
    fetchAPRs().catch(captureException);
  }, [fetchAPRs]);

  return {
    depositAPR,
    borrowAPR: marketAccount?.floatingBorrowRate ? Number(marketAccount.floatingBorrowRate) / 1e18 : undefined,
    loading,
  };
};
