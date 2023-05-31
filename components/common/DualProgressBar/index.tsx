import React, { FC, ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/system';

const ProgressBar = styled('div')(({ theme }) => ({
  display: 'flex',
  height: 8,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[300],
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
}));

const FirstProgressBar = styled('div')<{ width: number; bgcolor: string }>(({ width, bgcolor }) => ({
  width: `${width}%`,
  borderRadius: '4px 0 0 4px',
  backgroundColor: bgcolor,
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
    backgroundColor: bgcolor,
    borderRadius: '50%',
    transform: 'scaleX(0.6)',
    transition: 'background-color 0.3s',
  },
}));

const SecondProgressBar = styled('div')<{ width: number; bgcolor: string }>(({ width, bgcolor }) => ({
  width: `${width}%`,
  borderRadius: '0 4px 4px 0',
  backgroundColor: bgcolor,
  transition: 'background-color 0.3s',
  '&:hover': {
    cursor: 'pointer',
  },
}));

interface DualProgressBarProps {
  value1: number;
  value2: number;
  color1?: string;
  color2?: string;
  tooltip1?: ReactNode;
  tooltip2?: ReactNode;
}

const DualProgressBar: FC<DualProgressBarProps> = ({
  value1 = 0,
  value2 = 0,
  color1 = '#0095FF',
  color2 = '#33CC59',
  tooltip1 = value1.toString(),
  tooltip2 = value2.toString(),
}) => {
  return (
    <ProgressBar>
      {value1 > 0 && (
        <Tooltip title={tooltip1} placement="top" arrow enterTouchDelay={0}>
          <FirstProgressBar width={value1} bgcolor={color1} />
        </Tooltip>
      )}
      <Tooltip title={tooltip2} placement="top" arrow enterTouchDelay={0}>
        <SecondProgressBar width={value2} bgcolor={color2} />
      </Tooltip>
    </ProgressBar>
  );
};

export default DualProgressBar;
