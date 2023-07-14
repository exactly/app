import React, { FC, PropsWithChildren, useMemo } from 'react';
import { Box, Typography, Tooltip, Divider } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';
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
      <Tooltip
        title={t(
          "Indicates the potential annual returns from a strategy of repeated borrowing and resupplying of assets, possibly across different asset types. This 'looping' can boost your APR, but keep in mind it comes with heightened risk.",
        )}
        placement="top"
        arrow
        enterTouchDelay={0}
        sx={{ cursor: 'pointer' }}
      >
        <Box display="flex" alignItems="center" gap={1} width="max-content">
          <Typography variant="caption" color="figma.grey.600">
            {t('Loop APR')}
          </Typography>
          <InfoOutlinedIcon sx={{ fontSize: 12, color: 'figma.grey.500' }} />
        </Box>
      </Tooltip>
      {disabled ? (
        <Typography variant="h6">{t('N/A')}</Typography>
      ) : (
        <Tooltip title={<APRBreakdown />} placement="top" arrow enterTouchDelay={0} sx={{ cursor: 'pointer' }}>
          <Box display="flex" gap={0.5} alignItems="center" width="min-content">
            <Typography variant="h6">{toPercentage(loopAPR)}</Typography>
            <RewardsGroup />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

const APRBreakdown = () => {
  const { t } = useTranslation();
  const { marketAPR, rewardsAPR, nativeAPR } = useLeveragerContext();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <APRBreakdownItem title={t('Market APR')} value={toPercentage(marketAPR)}>
        <RewardsGroup withNative={false} withRewards={false} size={16} />
      </APRBreakdownItem>
      {!!rewardsAPR && (
        <>
          <Divider flexItem sx={{ mx: 0.5 }} />
          <APRBreakdownItem title={t('Rewards APR')} value={toPercentage(rewardsAPR)}>
            <RewardsGroup withNative={false} withMarket={false} size={16} />
          </APRBreakdownItem>
        </>
      )}
      {!!nativeAPR && (
        <>
          <Divider flexItem sx={{ mx: 0.5 }} />
          <APRBreakdownItem title={t('Native APR')} value={toPercentage(nativeAPR)}>
            <RewardsGroup withRewards={false} withMarket={false} size={16} />
          </APRBreakdownItem>
        </>
      )}
    </Box>
  );
};

type APRBreakdownItemProps = {
  title: string;
  value: string;
};

const APRBreakdownItem: FC<PropsWithChildren & APRBreakdownItemProps> = ({ title, value, children }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="left" px={0.5}>
      <Box display="flex" alignItems="center">
        <Typography fontFamily="IBM Plex Mono" fontWeight={600} fontSize={10} color="figma.grey.500">
          {title.toUpperCase()}
        </Typography>
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
