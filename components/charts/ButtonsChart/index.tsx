import { Box, Button, Typography, useTheme } from '@mui/material';
import React, { FC, useState } from 'react';
import { track } from '../../../utils/segment';

type Props = {
  buttons: ButtonChart[];
  defaultSelected?: number;
};

type ButtonChart = {
  label: string;
  onClick: () => void;
};

const ButtonsChart: FC<Props> = ({ buttons, defaultSelected }) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<number>(defaultSelected || 0);

  const handleClick = (index: number) => {
    if (selected === index) return;
    setSelected(index);
    buttons[index].onClick();
    track('Button Clicked', {
      location: 'Chart',
      name: 'chart',
      text: buttons[index].label,
    });
  };

  return (
    <Box display="flex" border={`1px ${theme.palette.grey[300]} solid`} borderRadius="16px">
      {buttons.map(({ label }, i) => (
        <Button
          key={`button_chart_${label}_${i}`}
          onClick={() => handleClick(i)}
          variant={i === selected ? 'contained' : 'text'}
          sx={{
            height: '24px',
            minWidth: '35px',
            px: '10px',
            color: i === selected ? 'figma.grey.50' : 'figma.grey.600',
          }}
        >
          <Typography variant="subtitle2" fontSize={{ xs: '9px', sm: '12px' }}>
            {label}
          </Typography>
        </Button>
      ))}
    </Box>
  );
};

export default React.memo(ButtonsChart);
