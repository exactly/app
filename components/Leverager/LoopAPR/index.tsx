import React, { FC, PropsWithChildren } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip, Divider, IconButton, Skeleton } from '@mui/material';
import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useLeveragerContext } from 'contexts/LeveragerContext';

const LoopAPR = () => {
  const { t } = useTranslation();
  const { input, loopAPR } = useLeveragerContext();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="caption" color="figma.grey.600">
        {t('Loop APR')}
      </Typography>
      {input.collateralSymbol && input.borrowSymbol ? (
        <Box display="flex" gap={0.5} alignItems="center">
          <Tooltip title={<APRBreakdown />} placement="top" arrow enterTouchDelay={0} sx={{ cursor: 'pointer' }}>
            <Typography variant="h6">{toPercentage(loopAPR)}</Typography>
          </Tooltip>

          <RewardsGroup />
        </Box>
      ) : (
        <Skeleton width={112} height={36} />
      )}
    </Box>
  );
};

const APRBreakdown = () => {
  const { t } = useTranslation();
  const { marketAPR, rewardsAPR, nativeAPR } = useLeveragerContext();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <APRBreakdownItem title={t('Market APR')} link="" value={toPercentage(marketAPR)} />
      <Divider flexItem sx={{ mx: 0.5 }} />
      <APRBreakdownItem title={t('Rewards APR')} link="" value={toPercentage(rewardsAPR)}>
        <RewardsGroup withNative={false} size={16} />
      </APRBreakdownItem>
      <Divider flexItem sx={{ mx: 0.5 }} />
      <APRBreakdownItem title={t('Native APR')} link="" value={toPercentage(nativeAPR)}>
        <RewardsGroup withRewards={false} size={16} />
      </APRBreakdownItem>
    </Box>
  );
};

type APRBreakdownItemProps = {
  title: string;
  link: string;
  value: string;
};

const APRBreakdownItem: FC<PropsWithChildren & APRBreakdownItemProps> = ({ title, link, value, children }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="left" px={0.5}>
      <Box display="flex" alignItems="center">
        <Typography fontFamily="IBM Plex Mono" fontWeight={600} fontSize={10} color="figma.grey.500">
          {title.toUpperCase()}
        </Typography>
        <a target="_blank" rel="noreferrer noopener" href={link}>
          <IconButton size="small">
            <OpenInNewIcon sx={{ height: 12, width: 12, color: 'figma.grey.500' }} />
          </IconButton>
        </a>
      </Box>
      <Box display="flex" alignItems="center" gap={0.2}>
        <Typography fontWeight={500} fontSize={14}>
          {value}
        </Typography>
        {children}
      </Box>
    </Box>
  );
};

type RewardsGroupProps = {
  withNative?: boolean;
  withRewards?: boolean;
  size?: number;
};

const RewardsGroup: FC<RewardsGroupProps> = ({ withNative = true, withRewards = true, size = 20 }) => {
  const { nativeRewards, marketRewards } = useLeveragerContext();

  const all = [...(withRewards ? marketRewards : []), ...(withNative ? nativeRewards : [])];

  return (
    <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: size, height: size, fontSize: 10 } }}>
      {all.map((rewardSymbol) => (
        <Avatar key={rewardSymbol} alt={rewardSymbol} src={`/img/assets/${rewardSymbol}.svg`} />
      ))}
    </AvatarGroup>
  );
};

export default LoopAPR;
