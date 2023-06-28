import React, { FC, PropsWithChildren, useMemo } from 'react';
import { Box, Typography, Tooltip, Divider, IconButton } from '@mui/material';
import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useLeveragerContext } from 'contexts/LeveragerContext';
import RewardsGroup from '../RewardsGroup';

const LoopAPR = () => {
  const { t } = useTranslation();
  const { input, loopAPR, currentLeverageRatio } = useLeveragerContext();

  const disabled = useMemo(
    () => !input.collateralSymbol || !input.borrowSymbol || (currentLeverageRatio === 1 && input.leverageRatio === 1),
    [currentLeverageRatio, input.borrowSymbol, input.collateralSymbol, input.leverageRatio],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="caption" color="figma.grey.600">
        {t('Loop APR')}
      </Typography>
      {disabled ? (
        <Typography variant="h6">{t('N/A')}</Typography>
      ) : (
        <Box display="flex" gap={0.5} alignItems="center">
          <Tooltip title={<APRBreakdown />} placement="top" arrow enterTouchDelay={0} sx={{ cursor: 'pointer' }}>
            <Typography variant="h6">{toPercentage(loopAPR)}</Typography>
          </Tooltip>
          <RewardsGroup />
        </Box>
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
      {!!rewardsAPR && (
        <>
          <Divider flexItem sx={{ mx: 0.5 }} />
          <APRBreakdownItem title={t('Rewards APR')} link="" value={toPercentage(rewardsAPR)}>
            <RewardsGroup withNative={false} size={16} />
          </APRBreakdownItem>
        </>
      )}
      {!!nativeAPR && (
        <>
          <Divider flexItem sx={{ mx: 0.5 }} />
          <APRBreakdownItem title={t('Native APR')} link="" value={toPercentage(nativeAPR)}>
            <RewardsGroup withRewards={false} size={16} />
          </APRBreakdownItem>
        </>
      )}
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

export default LoopAPR;
