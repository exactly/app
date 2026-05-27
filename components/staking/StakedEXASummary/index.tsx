import React, { FC, useMemo } from 'react';
import { AvatarGroup, Avatar, Box, Skeleton, Typography, Tooltip } from '@mui/material';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { useEXAPrice } from 'hooks/useEXA';
import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import { calculateStakingRewardsAPR, calculateTotalStakingRewardsAPR } from 'utils/calculateStakingAPR';
import { InfoOutlined } from '@mui/icons-material';
import { formatEther, getAddress } from 'viem';
import getVouchersPrice from 'utils/getVouchersPrice';
import { useContractEvents } from 'wagmi';
import { stakedExaAbi, stakedExaAddress, stakedExaBlock } from 'generated/wagmi';
import { defaultChain } from 'utils/client';

const stakedExaChainId = Object.keys(stakedExaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof stakedExaAddress => chainId === defaultChain.id);

function StakedEXASummary() {
  const { t } = useTranslation();
  const { totalAssets, rewardsTokens, rewards } = useStakeEXA();
  const exaPrice = useEXAPrice();
  const { accountData } = useAccountData();
  const stakedEXA = stakedExaChainId === undefined ? undefined : stakedExaAddress[stakedExaChainId];

  const rewardsAPR = useMemo(() => {
    return calculateStakingRewardsAPR(totalAssets, rewards, accountData, exaPrice);
  }, [totalAssets, rewards, accountData, exaPrice]);

  const totalRewardsAPR = useMemo(() => {
    return calculateTotalStakingRewardsAPR(rewardsAPR);
  }, [rewardsAPR]);

  const {
    data: rewardAmountNotified = {},
    isLoading: totalFeesLoading,
    isFetching: totalFeesFetching,
    isError: totalFeesError,
  } = useContractEvents({
    address: stakedEXA,
    abi: stakedExaAbi,
    eventName: 'RewardAmountNotified',
    strict: true,
    args: stakedEXA ? { notifier: stakedEXA } : undefined,
    fromBlock: stakedExaChainId === undefined ? undefined : stakedExaBlock[stakedExaChainId],
    toBlock: 'latest',
    chainId: stakedExaChainId,
    query: {
      enabled: Boolean(stakedEXA && accountData && rewards),
      select: (logs) =>
        logs.reduce(
          (total, { args: { reward, amount } }) => {
            total[reward] = (total[reward] || 0n) + amount;
            return total;
          },
          {} as Record<string, bigint>,
        ),
    },
  });

  const totalFees = useMemo(() => {
    if (!accountData || !rewards || !stakedEXA || totalFeesError) return;
    return Object.entries(rewardAmountNotified).reduce((total, [id, amount]) => {
      const reward = getAddress(id);
      const rr = accountData.find((a) => a.asset === reward || a.market === reward);
      const symbol = rewards.find((r) => r.reward === reward)?.symbol;
      return total + (amount * getVouchersPrice(accountData, symbol || '')) / 10n ** BigInt(rr?.decimals || 18);
    }, 0n);
  }, [accountData, rewardAmountNotified, rewards, stakedEXA, totalFeesError]);

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={7}>
      <Box>
        <Typography variant="h6">{t('Total EXA Staked')}</Typography>
        <Box display="flex" gap={1}>
          {totalAssets === undefined ? (
            <Skeleton variant="text" width={80} />
          ) : (
            <Typography fontSize={32} fontWeight={500}>
              {formatNumber(Number(totalAssets) / 1e18)}
            </Typography>
          )}
          <Typography fontSize={32} fontWeight={500} color="#B4BABF">
            {t('EXA')}
          </Typography>
        </Box>
      </Box>
      <Box>
        <Box display="flex" gap={1}>
          <Typography variant="h6">{t('Estimated APR')}</Typography>
          <Tooltip
            title={
              <Typography sx={{ fontSize: '11.5px', fontWeight: '400' }}>
                {t(
                  "The 'Estimated APR' is equal to 50% of last week's treasury fees from the USDC market (annualized) divided by the total EXA Staked (in $).",
                )}
              </Typography>
            }
            placement="top"
            arrow
          >
            <InfoOutlined sx={{ fontSize: '19px', my: 'auto', color: 'figma.grey.500', cursor: 'pointer' }} />
          </Tooltip>
        </Box>
        <Box display="flex" gap={1}>
          {totalRewardsAPR === undefined ? (
            <Skeleton variant="text" width={100} height={45} />
          ) : (
            <Typography fontSize={32} fontWeight={500}>
              {formatNumber(totalRewardsAPR)}%
            </Typography>
          )}
          {rewardsTokens === undefined ? (
            <Skeleton variant="text" width={80} />
          ) : (
            <Tooltip title={<TooltipContent rewardsData={rewardsAPR} />} placement="top" arrow>
              <AvatarGroup
                max={6}
                sx={{
                  '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' },
                  alignItems: 'center',
                }}
              >
                {rewardsTokens.map((symbol) => {
                  const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
                  const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;
                  return <Avatar key={symbol} alt={symbol} src={imagePath} />;
                })}
              </AvatarGroup>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box>
        <Typography variant="h6">{t('Total Fees Shared')}</Typography>
        <Box display="flex" gap={1}>
          {totalFeesLoading || totalFeesFetching || totalFees === undefined ? (
            <Skeleton variant="text" width={80} />
          ) : (
            <Typography fontSize={32} fontWeight={500}>
              ${formatNumber(formatEther(totalFees), 'USD')}
            </Typography>
          )}
          <Typography fontSize={32} fontWeight={500} color="#B4BABF">
            {t('USD')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

type RewardData = {
  symbol: string;
  apr: number;
};

const TooltipContent: FC<{ rewardsData?: RewardData[] }> = ({ rewardsData }) => {
  if (!rewardsData || rewardsData.length === 0) return null;

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      {rewardsData.map(({ symbol, apr }) => {
        const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
        const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;
        return (
          <Box key={symbol} sx={{ display: 'flex', alignItems: 'center' }} gap={1} justifyContent="flex-end">
            <Typography fontWeight={400} fontSize={14} ml={0.5} color="grey.900">
              {symbol}
            </Typography>
            <Image src={imagePath} alt={symbol} width="24" height="24" />
            <Typography fontWeight={400} fontSize={14} ml={0.5} color="grey.900">
              {formatNumber(apr)}%
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default React.memo(StakedEXASummary);
