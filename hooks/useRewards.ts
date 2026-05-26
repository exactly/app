import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';

import handleOperationError from 'utils/handleOperationError';
import useAccountData from './useAccountData';

import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import {
  previewerAbi,
  rewardsControllerAbi,
  rewardsControllerAddress,
  useReadRewardsControllerAllMarketsOperations,
  useSimulateRewardsControllerClaim,
  useSimulateRewardsControllerClaimAll,
  useWriteRewardsControllerClaim,
  useWriteRewardsControllerClaimAll,
} from 'generated/wagmi';
import { Transaction } from 'types/Transaction';
import { parseEther } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';
import { useConnection } from 'wagmi';

export type RewardRates = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof previewerAbi, 'exactly'>['outputs']
>[number][number]['rewardRates'];

export type Rewards = Record<string, { address: Address; amount: bigint; usdPrice: bigint }>;
export type Rates = Record<string, RewardRates>;
type ClaimArgs = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof rewardsControllerAbi, 'claim'>['inputs']>;

export default () => {
  const { account: walletAddress } = useReadOnly();
  const { isConnected } = useConnection();
  const { accountData, getMarketAccount, refreshAccountData } = useAccountData();
  const rewardsControllerChainId = Object.keys(rewardsControllerAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof rewardsControllerAddress => chainId === defaultChain.id);

  const [isLoading, setIsLoading] = useState(false);
  const [claimArgs, setClaimArgs] = useState<ClaimArgs>();
  const claimSetTx = useRef<((tx: Transaction) => void) | undefined>(undefined);
  const { data: marketOps } = useReadRewardsControllerAllMarketsOperations({
    chainId: rewardsControllerChainId,
    query: { enabled: rewardsControllerChainId !== undefined },
  });

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
          if (amount === 0n && assetSymbol !== 'esEXA') return acc;
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
  const claimAllSimulation = useSimulateRewardsControllerClaimAll({
    account: walletAddress,
    chainId: rewardsControllerChainId,
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(claimable && walletAddress && rewardsControllerChainId !== undefined) },
  });
  const claimSimulation = useSimulateRewardsControllerClaim({
    account: walletAddress,
    chainId: rewardsControllerChainId,
    args: claimArgs,
    query: { enabled: Boolean(claimArgs && walletAddress && rewardsControllerChainId !== undefined) },
  });
  const { writeContractAsync: writeClaimAll } = useWriteRewardsControllerClaimAll();
  const { writeContractAsync: writeClaim } = useWriteRewardsControllerClaim();

  const claimAll = useCallback(async () => {
    if (!claimable || !walletAddress) return;

    try {
      setIsLoading(true);
      const claimAllRequest = claimAllSimulation.data ?? (await claimAllSimulation.refetch()).data;
      if (!claimAllRequest) return;
      const hash = await writeClaimAll(claimAllRequest.request);
      await waitForTransaction({ hash });

      await refreshAccountData();
    } catch (e) {
      handleOperationError(e);
    } finally {
      setIsLoading(false);
    }
  }, [claimAllSimulation, claimable, walletAddress, refreshAccountData, writeClaimAll]);

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
      if (!isConnected || !marketOps?.length || !walletAddress) return;

      setIsLoading(true);

      const tokens = assets.flatMap((asset) => (rewards[asset] ? [rewards[asset].address] : []));
      if (!tokens.length || !to) {
        setIsLoading(false);
        return;
      }
      claimSetTx.current = setTx;
      setClaimArgs([marketOps, to, tokens]);
    },
    [isConnected, marketOps, rewards, walletAddress],
  );

  useEffect(() => {
    if (!claimArgs || !claimSimulation.data) return;
    setClaimArgs(undefined);
    void (async () => {
      try {
        const hash = await writeClaim({ account: walletAddress, chainId: rewardsControllerChainId, args: claimArgs });
        claimSetTx.current?.({ hash, status: 'loading' });
        const { status } = await waitForTransaction({ hash });
        claimSetTx.current?.({ hash, status: status === 'success' ? 'success' : 'error' });

        await refreshAccountData();
      } catch (e) {
        handleOperationError(e);
      } finally {
        claimSetTx.current = undefined;
        setIsLoading(false);
      }
    })();
  }, [claimArgs, claimSimulation.data, refreshAccountData, rewardsControllerChainId, walletAddress, writeClaim]);

  useEffect(() => {
    if (!claimArgs || !claimSimulation.error) return;
    claimSetTx.current = undefined;
    setClaimArgs(undefined);
    setIsLoading(false);
    handleOperationError(claimSimulation.error);
  }, [claimArgs, claimSimulation.error]);

  return { rewards, rates, claimable, claim, claimAll, isLoading };
};
