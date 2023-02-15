import { useContext, useMemo, useCallback, useState } from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';

import { useWeb3 } from './useWeb3';
import useRewardsController from './useRewardsController';
import AccountDataContext from 'contexts/AccountDataContext';
import handleOperationError from 'utils/handleOperationError';
import { Previewer } from 'types/contracts';

type Rewards = Record<string, BigNumber>;
type Rates = Record<string, Previewer.RewardRateStructOutput[]>;

export default () => {
  const { walletAddress } = useWeb3();
  const RewardsController = useRewardsController();
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const [isLoading, setIsLoading] = useState(false);

  const rewards = useMemo<Rewards>(() => {
    if (!accountData) return {};

    return Object.values(accountData)
      .flatMap(({ claimableRewards }) => claimableRewards)
      .reduce((acc, { assetSymbol, amount }) => {
        acc[assetSymbol] = acc[assetSymbol] ? acc[assetSymbol].add(amount) : amount;
        return acc;
      }, {} as Rewards);
  }, [accountData]);

  const claimable = useMemo<boolean>(() => {
    return Object.values(rewards).some((amount) => amount.gt(Zero));
  }, [rewards]);

  const claim = useCallback(async () => {
    if (!claimable || !RewardsController || !walletAddress) return;

    try {
      setIsLoading(true);
      const tx = await RewardsController.claimAll(walletAddress);
      await tx.wait();

      await getAccountData();
    } catch (e) {
      handleOperationError(e);
    } finally {
      setIsLoading(false);
    }
  }, [claimable, RewardsController, walletAddress, getAccountData]);

  const rates = useMemo<Rates>(() => {
    if (!accountData) return {};
    return Object.fromEntries(
      Object.values(accountData).map(({ assetSymbol, rewardRates }) => [assetSymbol, rewardRates]),
    );
  }, [accountData]);

  return { rewards, rates, claimable, claim, isLoading };
};
