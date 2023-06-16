import { useMemo, useCallback, useState } from 'react';
import { waitForTransaction } from '@wagmi/core';

import { useWeb3 } from './useWeb3';
import useRewardsController from './useRewardsController';
import handleOperationError from 'utils/handleOperationError';
import useAccountData from './useAccountData';
import useAnalytics from './useAnalytics';

import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { previewerABI } from 'types/abi';

export type RewardRates = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof previewerABI, 'exactly'>['outputs']
>[number][number]['rewardRates'];

export type Rewards = Record<string, bigint>;
export type Rates = Record<string, RewardRates>;

export default () => {
  const { walletAddress, chain } = useWeb3();
  const controller = useRewardsController();
  const { accountData, refreshAccountData } = useAccountData();

  const [isLoading, setIsLoading] = useState(false);

  const rewards = useMemo<Rewards>(() => {
    if (!accountData) return {};

    return accountData
      .flatMap(({ claimableRewards }) => claimableRewards)
      .reduce((acc, { assetSymbol, amount }) => {
        acc[assetSymbol] = acc[assetSymbol] ? acc[assetSymbol] + amount : amount;
        return acc;
      }, {} as Rewards);
  }, [accountData]);

  const { transaction } = useAnalytics({ rewards });

  const claimable = useMemo<boolean>(() => {
    return Object.values(rewards).some((amount) => amount > 0n);
  }, [rewards]);

  const claim = useCallback(async () => {
    if (!claimable || !controller || !walletAddress) return;

    try {
      setIsLoading(true);
      transaction.addToCart('claimAll');
      const hash = await controller.write.claimAll([walletAddress], { chain, account: walletAddress });
      transaction.beginCheckout('claimAll');
      const { status } = await waitForTransaction({ hash });
      if (status) transaction.purchase('claimAll');

      await refreshAccountData();
    } catch (e) {
      transaction.removeFromCart('claimAll');
      handleOperationError(e);
    } finally {
      setIsLoading(false);
    }
  }, [claimable, controller, walletAddress, transaction, chain, refreshAccountData]);

  const rates = useMemo<Rates>(() => {
    if (!accountData) return {};
    return Object.fromEntries(accountData.map(({ assetSymbol, rewardRates }) => [assetSymbol, rewardRates]));
  }, [accountData]);

  return { rewards, rates, claimable, claim, isLoading };
};
