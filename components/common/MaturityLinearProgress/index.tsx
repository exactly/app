import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import daysLeft from 'utils/daysLeft';

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

type Props = {
  maturityDate: number;
};

function MaturityLinearProgress({ maturityDate }: Props) {
  const progress = useMemo(() => {
    const oneHour = 3600;
    const oneDay = oneHour * 24;
    const maturityLife = oneDay * 7 * 12;
    const nowInSeconds = Date.now() / 1000;
    const startDate = maturityDate - maturityLife;
    const current = nowInSeconds - startDate;
    return Math.min((current * 100) / maturityLife, 100);
  }, [maturityDate]);

  const daysToMaturity = useMemo(() => daysLeft(maturityDate), [maturityDate]);
  const isCompleted = progress === 100;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {isCompleted ? (
          <>
            <Typography variant="subtitle2" color="#008CF4">
              Completed
            </Typography>
            <CheckCircleIcon sx={{ color: '#008CF4', fontSize: '15px' }} />
          </>
        ) : (
          <>
            <Typography variant="subtitle2">{`${Math.round(progress)}%`}</Typography>
            <Typography sx={{ fontWeight: 500, fontSize: 12, color: '#94999E' }}>{`${daysToMaturity} left`}</Typography>
          </>
        )}
      </Box>
      <StyledLinearProgress variant="determinate" value={progress} barColor={isCompleted ? '#008CF4' : 'primary'} />
    </Box>
  );
}

export default MaturityLinearProgress;
