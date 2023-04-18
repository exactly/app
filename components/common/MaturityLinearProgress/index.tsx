import React, { useMemo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled, useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import daysLeft from 'utils/daysLeft';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { formatFixed } from '@ethersproject/bignumber';
import { useTranslation } from 'react-i18next';

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'barColor',
})<{ barColor: string }>(({ theme, barColor }) => ({
  height: 8,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[100],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: barColor,
  },
}));

const colors = {
  info: '#008CF4',
  warning: '#FFA500',
  error: '#FF1414',
} as const;

type Props = {
  symbol: string;
  operation: 'deposit' | 'borrow';
  maturityDate: number;
};

function MaturityLinearProgress({ symbol, operation, maturityDate }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { marketAccount } = useAccountData(symbol);
  const progress = useMemo(() => {
    const oneHour = 3600;
    const oneDay = oneHour * 24;
    const maturityLife = oneDay * 7 * 4 * (marketAccount?.maxFuturePools ?? 4);
    const nowInSeconds = dayjs().unix();
    const startDate = maturityDate - maturityLife;
    const current = nowInSeconds - startDate;
    return Math.min((current * 100) / maturityLife, 100);
  }, [maturityDate, marketAccount?.maxFuturePools]);

  const daysToMaturity = useMemo(() => daysLeft(maturityDate), [maturityDate]);
  const isCompleted = progress === 100;

  const { color, Icon } = useMemo(() => {
    switch (operation) {
      case 'deposit':
        if (progress >= 100) {
          return { color: colors['info'], Icon: CheckCircleIcon };
        }
        return { Icon: CheckCircleIcon };
      case 'borrow':
        if (progress >= 100) {
          return { color: colors['error'], Icon: ReportProblemRoundedIcon };
        } else if (progress > 80) {
          return { color: colors['warning'] };
        } else return {};
    }
  }, [operation, progress]);

  const tooltip =
    operation === 'borrow' && marketAccount
      ? t(`Late repayment will result in a penalty daily rate of {{penaltyRate}}`, {
          penaltyRate: toPercentage(parseFloat(formatFixed(marketAccount.penaltyRate, 18)) * 86_400),
        })
      : '';

  return (
    <Tooltip title={tooltip} arrow>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {isCompleted ? (
            <>
              <Typography variant="subtitle2" color={color}>
                {t('Completed')}
              </Typography>
              {Icon && <Icon sx={{ color, fontSize: '14px' }} />}
            </>
          ) : (
            <>
              <Typography variant="subtitle2">{Math.round(progress)}%</Typography>
              <Typography sx={{ fontWeight: 500, fontSize: 11, color: '#94999E' }}>
                {t('{{daysLeft}} left', { daysLeft: daysToMaturity })}
              </Typography>
            </>
          )}
        </Box>
        <StyledLinearProgress variant="determinate" value={progress} barColor={color ? color : palette.grey[900]} />
      </Box>
    </Tooltip>
  );
}

export default MaturityLinearProgress;
