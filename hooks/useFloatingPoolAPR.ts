import networkData from 'config/networkData.json' assert { type: 'json' };
import { useCallback, useState } from 'react';
import queryRates from 'utils/queryRates';
import useAccountData from './useAccountData';
import useDelayedEffect from './useDelayedEffect';
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

  const fetchAPRs = useCallback(
    async (cancelled: () => boolean) => {
      setLoading(true);

      if (!marketAccount || !chain) return setDepositAPR(undefined);

      try {
        const subgraphUrl = networkData[String(chain.id) as keyof typeof networkData]?.subgraph;
        if (!subgraphUrl) return;
        const [{ apr: depositAPRRate }] = await queryRates(subgraphUrl, marketAccount.market, 'deposit', {
          maxFuturePools: marketAccount.maxFuturePools,
        });

        if (cancelled()) return;
        setDepositAPR(depositAPRRate);
        setLoading(false);
      } catch {
        setDepositAPR(undefined);
      }
    },
    [marketAccount, chain],
  );

  const { isLoading: delayedLoading } = useDelayedEffect({ effect: fetchAPRs });

  return {
    depositAPR,
    borrowAPR:
      !loading && !delayedLoading && marketAccount?.floatingBorrowRate
        ? Number(marketAccount.floatingBorrowRate) / 1e18
        : undefined,
    loading: loading || delayedLoading,
  };
};
