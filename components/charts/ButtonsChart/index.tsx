import { Box, Button } from '@mui/material';
import React, { FC, useState } from 'react';

type Props = {
  buttons: ButtonChart[];
  defaultSelected?: number;
};

type ButtonChart = {
  label: string;
  onClick: () => void;
};

const ButtonsChart: FC<Props> = ({ buttons, defaultSelected }) => {
  const [selected, setSelected] = useState<number>(defaultSelected || 0);

  const handleClick = (index: number) => {
    if (selected === index) return;
    setSelected(index);
    buttons[index].onClick();
  };

  return (
    <Box display="flex">
      {buttons.map(({ label }, i) => (
        <Button
          key={`button_chart_${label}_${i}`}
          onClick={() => handleClick(i)}
          variant={i === selected ? 'contained' : 'outlined'}
          sx={{
            height: '32px',
            borderRadius: 0,
            '&:nth-of-type(1)': {
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
            },
            '&:nth-last-of-type(1)': {
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
            },
          }}
        >
          {label}
        </Button>
      ))}
    </Box>
  );
};

export default React.memo(ButtonsChart);
