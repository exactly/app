import React, { useMemo } from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MultiplierSlider = () => {
  const { t } = useTranslation();

  const minValue = useMemo(() => 1, []);
  const maxValue = useMemo(() => 7, []);
  const currentValue = useMemo(() => 2, []);
  const currentMark = useMemo(() => [{ value: currentValue }], [currentValue]);
  const [multiplier, setMultiplier] = React.useState<number>(currentValue);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="figma.grey.600">
          {t('Leverage')}
        </Typography>
        <Box
          display="flex"
          bgcolor={({ palette: { mode } }) => (mode === 'light' ? '#EEEEEE' : '#2A2A2A')}
          px={0.5}
          borderRadius="2px"
          alignItems="center"
          onClick={() => setMultiplier(currentValue)}
          sx={{ cursor: 'pointer' }}
        >
          <Typography fontFamily="IBM Plex Mono" fontSize={10}>{`${t('Current').toUpperCase()}:${'2.0'}x`}</Typography>
        </Box>
      </Box>
      <Box display="flex" justifyItems="space-between" alignItems="center" gap={2}>
        <Typography variant="h6">1x</Typography>
        <Slider
          value={multiplier}
          onChange={(_, value) => setMultiplier(value as number)}
          marks={currentMark}
          defaultValue={currentValue}
          valueLabelDisplay="on"
          min={minValue}
          max={maxValue}
          step={0.1}
          valueLabelFormat={(value) => `${value.toFixed(1)}x`}
          sx={{
            height: 4,
            '& .MuiSlider-thumb': {
              bgcolor: 'green',
              width: 16,
              height: 16,
              '&:before': {
                boxShadow: 'none',
              },
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: 'none',
              },
            },
            '& .MuiSlider-valueLabel': {
              margin: '4px',
              fontSize: 12,
              fontWeight: 700,
              padding: '1px 4px',
              bgcolor: 'green',
              color: 'white',
            },
            '& .MuiSlider-mark': {
              backgroundColor: 'currentColor',
              height: '16px',
              width: '2px',
              borderRadius: '10px',
              '&.MuiSlider-markActive': {
                opacity: 1,
                backgroundColor: 'currentColor',
              },
            },
          }}
        />
        <Typography variant="h6">Max</Typography>
      </Box>
    </Box>
  );
};

export default MultiplierSlider;
