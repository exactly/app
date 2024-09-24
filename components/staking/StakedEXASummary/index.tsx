import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AvatarGroup, Avatar, Box, Skeleton, Typography, Tooltip } from '@mui/material';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { useEXAPrice } from 'hooks/useEXA';
import useAccountData from 'hooks/useAccountData';
import formatNumber from 'utils/formatNumber';
import { calculateStakingRewardsAPR, calculateTotalStakingRewardsAPR } from 'utils/calculateStakingAPR';
import { InfoOutlined } from '@mui/icons-material';
import getStakingSharedFees from 'queries/getStakingSharedFees';
import useGraphClient from 'hooks/useGraphClient';
import { formatEther, getAddress } from 'viem';
import getVouchersPrice from 'utils/getVouchersPrice';

function StakedEXASummary() {
  const { t } = useTranslation();
  const { totalAssets, rewardsTokens, rewards } = useStakeEXA();
  const exaPrice = useEXAPrice();
  const { accountData } = useAccountData();
  const request = useGraphClient();

  const rewardsAPR = useMemo(() => {
    return calculateStakingRewardsAPR(totalAssets, rewards, accountData, exaPrice);
  }, [totalAssets, rewards, accountData, exaPrice]);

  const totalRewardsAPR = useMemo(() => {
    return calculateTotalStakingRewardsAPR(rewardsAPR);
  }, [rewardsAPR]);

  const [totalFees, setTotalFees] = useState<bigint | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const fetchFees = useCallback(async () => {
    interface StakingSharedFee {
      id: string;
      amount: string;
    }

    setLoading(true);
    try {
      const response = await request<{ stakingSharedFees: StakingSharedFee[] }>(getStakingSharedFees(), 'exactly');

      if (!response) {
        setLoading(false);
        return;
      }

      const data = response.stakingSharedFees;

      let totalUSD = 0n;

      data.forEach(({ id, amount }) => {
        if (!accountData || !rewards) return;
        const reward = getAddress(id);

        const rr = accountData.find((a) => a.asset === reward || a.market === reward);
        const symbol = rewards.find((r) => r.reward === reward)?.symbol;

        const decimals = rr?.decimals || 18;
        const decimalWAD = 10n ** BigInt(decimals);
        const usdPrice = getVouchersPrice(accountData, symbol || '');

        const feeUSD = (BigInt(amount) * usdPrice) / decimalWAD;
        totalUSD += feeUSD;
      });
      setTotalFees(totalUSD);
    } catch (error) {
      setTotalFees(undefined);
    } finally {
      setLoading(false);
    }
  }, [accountData, request, rewards]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

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
              {formatNumber(Number(totalRewardsAPR))}%
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
          {loading || totalFees === undefined ? (
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
  apr: bigint;
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
              {formatNumber(Number(apr))}%
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default React.memo(StakedEXASummary);
