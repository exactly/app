import React, { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import { parseEther } from 'viem';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import StakingProgressBar from '../StakingProgress/stakingProgressBar';

function Progress() {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const { start, totalClaimable, totalClaimed, totalEarned, parameters } = useStakeEXA();

  const isEnded = useMemo(() => {
    if (!start || !parameters) return false;
    const now = Math.floor(Date.now() / 1000);
    const avgStart = start === 0n ? parseEther(now.toString()) : start;
    const endTime = Number(avgStart / WAD + parameters.refTime);

    return now > endTime;
  }, [parameters, start]);

  return (
    <Box>
      <Box
        p={4}
        gap={8}
        borderRadius="16px"
        bgcolor="components.bg"
        boxShadow={() => (palette.mode === 'light' ? '0px 6px 10px 0px rgba(97, 102, 107, 0.20)' : '')}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        position="relative"
        overflow="hidden"
      >
        <Box display="flex" flexDirection="column" position="relative" zIndex={2} gap={2}>
          <Typography fontSize={19} fontWeight={700}>
            {t('Rewards')}
          </Typography>
          {start !== undefined && (
            <StakingProgressBar claimed={totalClaimed} claimable={totalClaimable} total={totalEarned} ended={isEnded} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(Progress);
