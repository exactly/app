import { useMemo, useCallback, useState } from 'react';
import { waitForTransaction, Address } from '@wagmi/core';

import { useWeb3 } from './useWeb3';
import useRewardsController from './useRewardsController';
import handleOperationError from 'utils/handleOperationError';
import useAccountData from './useAccountData';
import useAnalytics from './useAnalytics';

import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { previewerABI } from 'types/abi';
import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from 'utils/const';

export type RewardRates = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof previewerABI, 'exactly'>['outputs']
>[number][number]['rewardRates'];

export type Rewards = Record<string, { address: Address; amount: bigint }>;
export type Rates = Record<string, RewardRates>;

export default () => {
  const { walletAddress, opts, isConnected } = useWeb3();
  const controller = useRewardsController();
  const { accountData, refreshAccountData } = useAccountData();

  const [isLoading, setIsLoading] = useState(false);

  const rewards = useMemo<Rewards>(() => {
    if (!accountData) return {};

    return accountData
      .flatMap(({ claimableRewards }) => claimableRewards)
      .reduce((acc, { asset, assetSymbol, amount }) => {
        if (!acc[assetSymbol]) {
          acc[assetSymbol] = { address: asset, amount: amount };
          return acc;
        }
        acc[assetSymbol].amount += amount;
        return acc;
      }, {} as Rewards);
  }, [accountData]);

  const { transaction } = useAnalytics({ rewards });

  const claimable = useMemo<boolean>(() => {
    return Object.values(rewards).some(({ amount }) => amount > 0n);
  }, [rewards]);

  const claimAll = useCallback(async () => {
    if (!claimable || !controller || !walletAddress || !opts) return;

    try {
      setIsLoading(true);
      transaction.addToCart('claimAll');
      const args = [walletAddress] as const;
      const gas = await controller.estimateGas.claimAll(args, opts);
      const hash = await controller.write.claimAll(args, {
        ...opts,
        gasLimit: (gas * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
      });
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
  }, [claimable, controller, walletAddress, transaction, refreshAccountData, opts]);

  const rates = useMemo<Rates>(() => {
    if (!accountData) return {};
    return Object.fromEntries(accountData.map(({ assetSymbol, rewardRates }) => [assetSymbol, rewardRates]));
  }, [accountData]);

  const claim = useCallback(
    async ({ assets, to = walletAddress }: { assets: string[]; to?: Address }) => {
      if (!controller || !isConnected || !opts) return;

      setIsLoading(true);

      try {
        const marketOps = await controller.read.allMarketsOperations(opts);
        const tokens = assets.flatMap((asset) => (rewards[asset] ? [rewards[asset].address] : []));
        if (!marketOps.length || !tokens.length || !to) {
          return;
        }

        transaction.addToCart('claim');
        const args = [marketOps, to, tokens] as const;
        const gas = await controller.estimateGas.claim(args, opts);
        const hash = await controller.write.claim(args, {
          ...opts,
          gasLimit: (gas * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        });
        transaction.beginCheckout('claim');
        const { status } = await waitForTransaction({ hash });
        if (status) transaction.purchase('claim');

        await refreshAccountData();
      } catch (e) {
        transaction.removeFromCart('claim');
        handleOperationError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [controller, isConnected, opts, refreshAccountData, rewards, transaction, walletAddress],
  );

  return { rewards, rates, claimable, claim, claimAll, isLoading };
};
