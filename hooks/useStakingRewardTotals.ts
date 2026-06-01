import { useMemo } from 'react';
import { zeroAddress } from 'viem';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { WAD } from '@exactly/lib';
import { stakingPreviewerAbi, stakingPreviewerAddress, useReadStakingPreviewerStaking } from 'generated/wagmi';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { useEXAPrice } from 'hooks/useEXA';
import useReadOnly from 'hooks/useReadOnly';
import getVouchersPrice from 'utils/getVouchersPrice';
import { defaultChain } from 'utils/client';

export type Rewards = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof stakingPreviewerAbi, 'staking'>['outputs']
>[number]['rewards'][number];

const stakingPreviewerChainId = Object.keys(stakingPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof stakingPreviewerAddress => chainId === defaultChain.id);

export default () => {
  const { account } = useReadOnly();
  const { data } = useReadStakingPreviewerStaking({
    chainId: stakingPreviewerChainId,
    args: [account ?? zeroAddress],
    query: { enabled: stakingPreviewerChainId !== undefined, staleTime: 5_000 },
  });

  const { data: accountData } = usePreviewerExactly();
  const exaPrice = useEXAPrice();

  return useMemo(() => {
    const result = [...(data?.rewards ?? [])].reduce(
      (acc, item) => {
        let amountClaimable,
          amountClaimed,
          amountEarned = 0n;
        if (item.symbol === 'EXA') {
          amountClaimable = (item.claimable * (exaPrice || 1n * WAD)) / WAD;
          amountClaimed = (item.claimed * (exaPrice || 1n * WAD)) / WAD;
          amountEarned = (item.earned * (exaPrice || 1n * WAD)) / WAD;
        } else {
          if (!accountData) return acc;
          const r = accountData?.find((a) => a.asset === item.reward || a.market === item.reward);

          const usdPrice = getVouchersPrice(accountData, item.symbol);
          const decimals = r?.decimals || 18;
          const decimalWAD = 10n ** BigInt(decimals);

          amountClaimable = (item.claimable * usdPrice) / decimalWAD;
          amountClaimed = (item.claimed * usdPrice) / decimalWAD;
          amountEarned = (item.earned * usdPrice) / decimalWAD;
        }

        const symbol = item.symbol;
        acc.claimableTokens[symbol] = (acc.claimableTokens[symbol] || 0n) + amountClaimable;
        acc.claimedTokens[symbol] = (acc.claimedTokens[symbol] || 0n) + amountClaimed;
        acc.earnedTokens[symbol] = (acc.earnedTokens[symbol] || 0n) + amountEarned;

        acc.totalClaimable += amountClaimable;
        acc.totalClaimed += amountClaimed;
        acc.totalEarned += amountEarned;

        if (item.rate > 0n) acc.rewardsTokens.push(symbol);
        return acc;
      },
      {
        totalClaimable: 0n,
        totalClaimed: 0n,
        totalEarned: 0n,
        claimableTokens: {} as Record<string, bigint>,
        claimedTokens: {} as Record<string, bigint>,
        earnedTokens: {} as Record<string, bigint>,
        rewardsTokens: [] as string[],
      },
    );

    const penalty =
      result.totalEarned > 0n
        ? ((result.totalEarned - (result.totalClaimable + result.totalClaimed)) * WAD) / result.totalEarned
        : 0n;

    return {
      totalClaimable: result.totalClaimable,
      totalClaimed: result.totalClaimed,
      totalEarned: result.totalEarned,
      penalty,
      rewardsTokens: result.rewardsTokens,
      claimableTokens: result.claimableTokens,
      claimedTokens: result.claimedTokens,
      earnedTokens: result.earnedTokens,
    };
  }, [accountData, exaPrice, data?.rewards]);
};
