import { useMemo, useCallback, useState } from 'react';
import { waitForTransaction, Address } from '@wagmi/core';

import { useWeb3 } from './useWeb3';
import useRewardsController from './useRewardsController';
import handleOperationError from 'utils/handleOperationError';
import useAccountData from './useAccountData';

import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { previewerABI } from 'types/abi';
import { Transaction } from 'types/Transaction';
import { gasLimit } from 'utils/gas';
import { parseEther } from 'viem';

export type RewardRates = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof previewerABI, 'exactly'>['outputs']
>[number][number]['rewardRates'];

export type Rewards = Record<string, { address: Address; amount: bigint; usdPrice: bigint }>;
export type Rates = Record<string, RewardRates>;

export default () => {
  const { walletAddress, opts, isConnected } = useWeb3();
  const controller = useRewardsController();
  const { accountData, getMarketAccount, refreshAccountData } = useAccountData();

  const [isLoading, setIsLoading] = useState(false);

  const rewards = useMemo<Rewards>(() => {
    if (!accountData || !getMarketAccount) return {};

    const price = accountData
      .flatMap(({ rewardRates }) => rewardRates)
      .reduce(
        (reward, { usdPrice, assetSymbol }) => {
          return { ...reward, [assetSymbol]: usdPrice };
        },
        {} as Record<string, bigint>,
      );

    return accountData
      .flatMap(({ claimableRewards }) => claimableRewards)
      .reduce((acc, { asset, assetSymbol, amount }) => {
        if (assetSymbol === '') return acc;
        if (!acc[assetSymbol]) {
          acc[assetSymbol] = { address: asset, amount, usdPrice: price[assetSymbol] };
          return acc;
        }
        acc[assetSymbol].amount += amount;
        return acc;
      }, {} as Rewards);
  }, [accountData, getMarketAccount]);

  const claimable = useMemo<boolean>(() => {
    return Object.values(rewards).some(({ amount }) => amount > 0n);
  }, [rewards]);

  const claimAll = useCallback(async () => {
    if (!claimable || !controller || !walletAddress || !opts) return;

    try {
      setIsLoading(true);
      const args = [walletAddress] as const;
      const gas = await controller.estimateGas.claimAll(args, opts);
      const hash = await controller.write.claimAll(args, {
        ...opts,
        gasLimit: gasLimit(gas),
      });
      await waitForTransaction({ hash });

      await refreshAccountData();
    } catch (e) {
      handleOperationError(e);
    } finally {
      setIsLoading(false);
    }
  }, [claimable, controller, walletAddress, refreshAccountData, opts]);

  const rates = useMemo<Rates>(() => {
    if (!accountData) return {};

    const min = parseEther('0.00005');
    return Object.fromEntries(
      accountData.map(({ assetSymbol, rewardRates }) => [
        assetSymbol,
        rewardRates
          .filter(
            ({ assetSymbol: _assetSymbol, borrow, floatingDeposit }) =>
              _assetSymbol !== '' && (borrow >= min || floatingDeposit >= min),
          )
          .map(({ borrow, floatingDeposit, ...reward }) => ({
            floatingDeposit: floatingDeposit < min ? 0n : floatingDeposit,
            borrow: borrow < min ? 0n : borrow,
            ...reward,
          })),
      ]),
    );
  }, [accountData]);

  const claim = useCallback(
    async ({
      assets,
      to = walletAddress,
      setTx,
    }: {
      assets: string[];
      to?: Address;
      setTx?: (tx: Transaction) => void;
    }) => {
      if (!controller || !isConnected || !opts) return;

      setIsLoading(true);

      try {
        const marketOps = await controller.read.allMarketsOperations(opts);
        const tokens = assets.flatMap((asset) => (rewards[asset] ? [rewards[asset].address] : []));
        if (!marketOps.length || !tokens.length || !to) {
          return;
        }

        const args = [marketOps, to, tokens] as const;
        const gas = await controller.estimateGas.claim(args, opts);
        const hash = await controller.write.claim(args, {
          ...opts,
          gasLimit: gasLimit(gas),
        });
        setTx && setTx({ hash, status: 'loading' });
        const { status } = await waitForTransaction({ hash });
        setTx && setTx({ hash, status: status ? 'success' : 'error' });

        await refreshAccountData();
      } catch (e) {
        handleOperationError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [controller, isConnected, opts, refreshAccountData, rewards, walletAddress],
  );

  return { rewards, rates, claimable, claim, claimAll, isLoading };
};
