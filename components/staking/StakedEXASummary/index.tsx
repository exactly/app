import React, { FC, useMemo } from 'react';
import { AvatarGroup, Avatar, Box, Skeleton, Typography, Tooltip } from '@mui/material';

import { useTranslation } from 'react-i18next';
import formatNumber from 'utils/formatNumber';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { useEXAPrice } from 'hooks/useEXA';
import useAccountData from 'hooks/useAccountData';
import getVouchersPrice from 'utils/getVouchersPrice';
import Image from 'next/image';

function StakedEXASummary() {
  const { t } = useTranslation();
  const { totalAssets, rewardsTokens, rewards } = useStakeEXA();
  const exaPrice = useEXAPrice();
  const { accountData } = useAccountData();

  const rewardsAPR = useMemo(() => {
    if (!totalAssets || !rewards || !accountData) return;
    return rewards.map((reward) => {
      const yearInSeconds = 31_536_000n;

      const rewardPrice = reward.symbol === 'EXA' ? exaPrice : getVouchersPrice(accountData, reward.symbol);
      const decimals = accountData.find((token) => token.symbol.includes(reward.symbol))?.decimals || 18;
      const decimalWAD = 10n ** BigInt(decimals);

      const apr = (((reward.rate * yearInSeconds * rewardPrice) / (totalAssets * exaPrice)) * 100n) / decimalWAD;

      return { symbol: reward.symbol, apr };
    });
  }, [totalAssets, rewards, accountData, exaPrice]);

  const totalRewardsAPR = useMemo(() => {
    if (!rewardsAPR) return;
    return rewardsAPR.reduce((acc, reward) => acc + reward.apr, 0n);
  }, [rewardsAPR]);

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
        <Typography variant="h6">{t('Estimated APR')}</Typography>
        <Box display="flex" gap={1}>
          <Typography fontSize={32} fontWeight={500}>
            {formatNumber(Number(totalRewardsAPR))}%
          </Typography>
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
          <Box key={symbol} sx={{ display: 'flex', alignItems: 'center' }}>
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
