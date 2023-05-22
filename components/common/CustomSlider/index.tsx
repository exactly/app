import React, { FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 6,
  padding: '15px 0',
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: theme.palette.primary.main,
  },
}));

type CustomSliderProps = {
  value: number;
  onChange: (event: Event, newValue: number | number[]) => void;
};

const CustomSlider: FC<CustomSliderProps> = ({ value, onChange }) => {
  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={1}>
          <Typography fontSize={19} fontWeight={700}>
            0%
          </Typography>
        </Grid>
        <Grid item xs={10}>
          <StyledSlider value={value} onChange={onChange} />
        </Grid>
        <Grid item xs={1}>
          <Typography fontSize={19} fontWeight={700}>
            {value}%
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomSlider;
