import React, { FC, useCallback } from 'react';
import Grid, { type GridProps } from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Slider, { type SliderProps } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
  height: 6,
  padding: '15px 0',
  overflow: 'visible',
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    opacity: 1,
  },
}));

type CustomSliderProps = {
  value: number;
  onChange: (value: number) => void;
} & Omit<GridProps, 'onChange'>;

const CustomSlider: FC<CustomSliderProps> = ({ value, onChange, ...props }) => {
  const handle: SliderProps['onChange'] = useCallback(
    (e: Event, newValue: number | number[]) => {
      if (Array.isArray(newValue)) return;
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <Grid container spacing={2} alignItems="center" justifyContent="space-between" {...props}>
      <Grid item>
        <Typography minWidth={30} fontSize={19} fontWeight={700}>
          0%
        </Typography>
      </Grid>
      <Grid item flexGrow={1}>
        <StyledSlider value={value} onChange={handle} min={1} />
      </Grid>
      <Grid item>
        <Typography textAlign="right" minWidth={52} fontSize={19} fontWeight={700}>
          {value}%
        </Typography>
      </Grid>
    </Grid>
  );
};

export default CustomSlider;
