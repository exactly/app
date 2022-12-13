import React from 'react';
import { Box, Typography } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';

const CustomLinearProgress = styled(LinearProgress, {
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
  progress: number;
  daysLeft: number;
};

function StyledLinearProgress({ progress, daysLeft }: Props) {
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
            <Typography sx={{ fontWeight: 500, fontSize: 12, color: '#94999E' }}>
              {`${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
            </Typography>
          </>
        )}
      </Box>
      <CustomLinearProgress variant="determinate" value={progress} barColor={isCompleted ? '#008CF4' : 'primary'} />
    </Box>
  );
}

export default StyledLinearProgress;
