import React, { FC, PropsWithChildren } from 'react';
import { Box, Typography, Avatar, AvatarGroup, Tooltip, Divider, IconButton } from '@mui/material';
import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const LoopAPR = () => {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="caption" color="figma.grey.600">
        {t('Loop APR')}
      </Typography>
      <Box display="flex" gap={0.5} alignItems="center">
        <Tooltip title={<APRBreakdown />} placement="top" arrow enterTouchDelay={0} sx={{ cursor: 'pointer' }}>
          <Typography variant="h6">{toPercentage(0.137)}</Typography>
        </Tooltip>

        <RewardsGroup />
      </Box>
    </Box>
  );
};

const APRBreakdown = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <APRBreakdownItem title={t('Market APR')} link="" value="7.4%" />
      <Divider flexItem sx={{ mx: 0.5 }} />
      <APRBreakdownItem title={t('Rewards APR')} link="" value="2.1%">
        <RewardsGroup withNative={false} size={16} />
      </APRBreakdownItem>
      <Divider flexItem sx={{ mx: 0.5 }} />
      <APRBreakdownItem title={t('Native APR')} link="" value="4.2%">
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
  const native = [{ symbol: 'WBTC' }];
  const rewards = [{ symbol: 'OP' }, { symbol: 'USDC' }];
  const all = [...(withRewards ? rewards : []), ...(withNative ? native : [])];

  return (
    <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: size, height: size, fontSize: 10 } }}>
      {all.map(({ symbol }) => (
        <Avatar key={symbol} alt={symbol} src={`/img/assets/${symbol}.svg`} />
      ))}
    </AvatarGroup>
  );
};

export default LoopAPR;
