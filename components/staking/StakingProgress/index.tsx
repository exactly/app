import React, { FC, ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/system';
import { Avatar, AvatarGroup, Box, Grid, Typography, useTheme } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import { formatEther } from 'viem';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

const ProgressBar = styled('div')<{ ended: boolean }>(({ ended, theme }) => ({
  display: 'flex',
  height: 24,
  borderRadius: 999,
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  ...(!ended && { border: `1px solid ${theme.palette.figma.green[100]}` }),
}));

const ClaimedProgressBar = styled('div')<{ width: number }>(({ width, theme }) => ({
  width: `${width}%`,
  borderRadius: '0px 0 0 0px',
  backgroundColor: theme.palette.figma.green[500],
  transition: 'background-color 0.3s',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    cursor: 'pointer',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    right: -4,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: theme.palette.figma.green[500],
    transform: 'scaleX(0.6)',
    transition: 'background-color 0.3s',
  },
}));

const RestProgressBar = styled('div')<{ width: number; ended?: boolean }>(({ width, ended, theme }) => ({
  width: `${width}%`,
  borderRadius: '0 4px 4px 0',
  backgroundColor: ended ? 'transparent' : theme.palette.figma.green[50],
  transition: 'background-color 0.3s',
  position: 'relative',
  '&:hover': {
    cursor: 'pointer',
  },
  ...(ended && {
    backgroundImage: `repeating-linear-gradient(
      -70deg,
      red,
      red 3px,
      #ffffff 3px,
      #ffffff 6px
    )`,
  }),
  '&::before': {
    content: '""',
    position: 'absolute',
    right: -4,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: ended ? 'transparent' : theme.palette.figma.green[50],
    backgroundImage: ended
      ? `repeating-linear-gradient(
      -70deg,
      #ffffff ,
      #ffffff 3px
      red 3px,
      red 6px,
    )`
      : 'none',
  },
}));

const ClaimableProgressBar = styled('div')<{ width: number }>(({ width, theme }) => ({
  width: `${width}%`,
  backgroundColor: theme.palette.figma.green[50],
  transition: 'background-color 0.3s',
  '&:hover': {
    cursor: 'pointer',
  },
  backgroundImage: `repeating-linear-gradient(
      -70deg,
      ${theme.palette.figma.green[500]},
      ${theme.palette.figma.green[500]} 3px,
      #ffffff 3px,
      #ffffff 6px
    )`,
}));

interface DualProgressBarProps {
  claimed: bigint;
  claimable: bigint;
  total: bigint;
  tooltip1?: ReactNode;
  tooltip2?: ReactNode;
  tooltip3?: ReactNode;
  ended: boolean;
}

const StakingProgressBar: FC<DualProgressBarProps> = ({
  claimed = 0n,
  claimable = 0n,
  total = 0n,
  tooltip1 = `$${formatNumber(formatEther(claimed), 'USD')}`,
  tooltip2 = `$${formatNumber(formatEther(claimable), 'USD')}`,
  tooltip3 = `$${formatNumber(formatEther(total - claimable - claimed), 'USD')}`,
  ended = false,
}) => {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { rewardsTokens, claimableTokens, claimedTokens, earnedTokens } = useStakeEXA();

  const claimedPercentage = total > 0n ? Number((claimed * 100n) / total) : 0;
  const claimablePercentage = total > 0n ? Number((claimable * 100n) / total) : 0;
  const restValue = Math.max(0, 100 - claimedPercentage - claimablePercentage);

  const remainingTokens = Object.keys(claimableTokens).reduce(
    (acc, symbol) => {
      const claimableValue = claimableTokens[symbol] || 0n;
      const claimedValue = claimedTokens[symbol] || 0n;
      const totalValue = earnedTokens[symbol] || 0n;

      const remainingValue = totalValue - claimableValue - claimedValue;

      acc[symbol] = remainingValue;

      return acc;
    },
    {} as Record<string, bigint>,
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <ProgressBar ended={ended}>
        <Tooltip title={tooltip1} placement="top" arrow enterTouchDelay={0}>
          <ClaimedProgressBar width={claimedPercentage} />
        </Tooltip>
        <Tooltip title={tooltip2} placement="top" arrow enterTouchDelay={0}>
          <ClaimableProgressBar width={claimablePercentage} />
        </Tooltip>
        <Tooltip title={tooltip3} placement="top" arrow enterTouchDelay={0}>
          <RestProgressBar width={restValue} ended={ended} />
        </Tooltip>
      </ProgressBar>
      <Grid container spacing={5} justifyContent="center">
        <Grid item xs={12} sm={4} textAlign="center">
          <Grid container justifyContent="center" alignItems="center" spacing={1}>
            <Grid item>
              <Box
                minWidth={16}
                minHeight={16}
                width={16}
                height={16}
                borderRadius="4px"
                sx={{ bgcolor: palette.figma.green[500], cursor: 'pointer' }}
              />
            </Grid>
            <Grid item>
              <Typography fontSize={16} fontWeight={700}>
                {t('Claimed')}
              </Typography>
            </Grid>
          </Grid>
          <Grid
            container
            justifyContent="center"
            spacing={1}
            sx={{
              paddingLeft: '0px',
            }}
          >
            <Grid item>
              <Typography fontSize={32}>${formatNumber(formatEther(claimed), 'USD')}</Typography>
            </Grid>
            <Grid item>
              <Tooltip title={<TooltipContent tokensData={claimedTokens} />} placement="top" arrow>
                <AvatarGroup
                  max={6}
                  sx={{
                    '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' },
                  }}
                >
                  {Object.entries(claimedTokens).map(([symbol]) => {
                    const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
                    const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;
                    return <Avatar key={symbol} alt={symbol} src={imagePath} />;
                  })}
                </AvatarGroup>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={4} textAlign="center">
          <Grid container justifyContent="center" alignItems="center" spacing={1}>
            <Grid item>
              <Box
                minWidth={16}
                minHeight={16}
                width={16}
                height={16}
                borderRadius="4px"
                sx={{
                  backgroundImage: `repeating-linear-gradient(
                  -70deg,
                  ${palette.figma.green[500]},
                  ${palette.figma.green[500]} 3px,
                  #ffffff 3px,
                  #ffffff 6px
                )`,
                  cursor: 'pointer',
                }}
              />
            </Grid>
            <Grid item>
              <Typography fontSize={16} fontWeight={700}>
                {t('Available to claim')}
              </Typography>
            </Grid>
          </Grid>
          <Grid container justifyContent="center" spacing={1}>
            <Grid item>
              <Typography fontSize={32}>${formatNumber(formatEther(claimable), 'USD')}</Typography>
            </Grid>
            <Grid item>
              <Tooltip title={<TooltipContent tokensData={claimableTokens} />} placement="top" arrow>
                <AvatarGroup
                  max={6}
                  sx={{
                    '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' },
                  }}
                >
                  {Object.entries(claimableTokens).map(([symbol]) => {
                    const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
                    const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;
                    return <Avatar key={symbol} alt={symbol} src={imagePath} />;
                  })}
                </AvatarGroup>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={4} textAlign="center">
          <Grid container justifyContent="center" alignItems="center" spacing={1}>
            <Grid item>
              <Box
                minWidth={16}
                minHeight={16}
                width={16}
                height={16}
                borderRadius="4px"
                sx={{
                  backgroundImage: ended
                    ? `repeating-linear-gradient( -70deg,red,red 3px,#ffffff 3px,#ffffff 6px)`
                    : 'none',
                  backgroundColor: !ended ? palette.figma.green[50] : 'transparent',
                  cursor: 'pointer',
                }}
              />
            </Grid>
            <Grid item>
              <Typography fontSize={16} fontWeight={700}>
                {ended ? t('Not available to claim') : t('Projected Remainder')}
              </Typography>
            </Grid>
          </Grid>
          <Grid container justifyContent="center" spacing={1}>
            <Grid item>
              <Typography fontSize={32}>${formatNumber(formatEther(total - claimable - claimed), 'USD')}</Typography>
            </Grid>
            <Grid item>
              <Tooltip title={<TooltipContent tokensData={remainingTokens} />} placement="top" arrow>
                <AvatarGroup
                  max={6}
                  sx={{
                    '& .MuiAvatar-root': { width: 32, height: 32, borderColor: 'transparent' },
                  }}
                >
                  {rewardsTokens.map((symbol) => {
                    const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
                    const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;
                    return <Avatar key={symbol} alt={symbol} src={imagePath} />;
                  })}
                </AvatarGroup>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

type TooltipContentProps = {
  tokensData?: Record<string, bigint>;
};

const TooltipContent: FC<TooltipContentProps> = ({ tokensData }) => {
  if (!tokensData) return null;

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      {Object.entries(tokensData).map(([symbol, valueUSD]) => {
        const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
        const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;
        return (
          <Box key={symbol} sx={{ display: 'flex', alignItems: 'center' }} gap={1} justifyContent="flex-end">
            <Typography fontWeight={400} fontSize={14} ml={0.5} color="grey.900">
              {symbol}
            </Typography>
            <Image src={imagePath} alt={symbol} width="24" height="24" />
            <Typography fontWeight={400} fontSize={14} ml={0.5} color="grey.900">
              ${formatNumber(formatEther(valueUSD), 'USD')}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default StakingProgressBar;
