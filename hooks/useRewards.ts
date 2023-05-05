import { useMemo, useCallback, useState } from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';

import { useWeb3 } from './useWeb3';
import useRewardsController from './useRewardsController';
import handleOperationError from 'utils/handleOperationError';
import { Previewer } from 'types/contracts';
import useAccountData from './useAccountData';
import useAnalytics from './useAnalytics';

export type Rewards = Record<string, BigNumber>;
export type Rates = Record<string, Previewer.RewardRateStructOutput[]>;

export default () => {
  const { walletAddress } = useWeb3();
  const RewardsController = useRewardsController();
  const { accountData, refreshAccountData } = useAccountData();

  const [isLoading, setIsLoading] = useState(false);

  const rewards = useMemo<Rewards>(() => {
    if (!accountData) return {};

    return accountData
      .flatMap(({ claimableRewards }) => claimableRewards)
      .reduce((acc, { assetSymbol, amount }) => {
        acc[assetSymbol] = acc[assetSymbol] ? acc[assetSymbol].add(amount) : amount;
        return acc;
      }, {} as Rewards);
  }, [accountData]);

  const { transaction } = useAnalytics({ rewards });

  const claimable = useMemo<boolean>(() => {
    return Object.values(rewards).some((amount) => amount.gt(Zero));
  }, [rewards]);

  const claim = useCallback(async () => {
    if (!claimable || !RewardsController || !walletAddress) return;

    try {
      setIsLoading(true);

      transaction.addToCart('claimAll');

      const tx = await RewardsController.claimAll(walletAddress);
      transaction.beginCheckout('claimAll');

      const { status } = await tx.wait();
      if (status) transaction.purchase('claimAll');

      await refreshAccountData();
    } catch (e) {
      transaction.removeFromCart('claimAll');
      handleOperationError(e);
    } finally {
      setIsLoading(false);
    }
  }, [claimable, RewardsController, walletAddress, refreshAccountData, transaction]);

  const rates = useMemo<Rates>(() => {
    if (!accountData) return {};
    return Object.fromEntries(accountData.map(({ assetSymbol, rewardRates }) => [assetSymbol, rewardRates]));
  }, [accountData]);

  return { rewards, rates, claimable, claim, isLoading };
};
