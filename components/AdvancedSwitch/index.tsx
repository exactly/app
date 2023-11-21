import React, { FC, useCallback } from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import { useCustomTheme } from 'contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Switch from 'components/Switch';
import { track } from 'utils/segment';

type Props = {
  sx?: BoxProps['sx'];
  fontSize?: number;
};

const AdvancedViewSwitch: FC<Props> = ({ sx, fontSize = 14 }) => {
  const { t } = useTranslation();
  const { view, setView } = useCustomTheme();

  const handleChange = useCallback(() => {
    const value = view === 'advanced' ? 'simple' : 'advanced';
    track('Option Selected', {
      name: 'advanced View',
      location: 'Settings',
      value,
      prevValue: view,
    });
    setView(value);
  }, [setView, view]);

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={sx}>
      <Typography fontSize={fontSize}>{t('Advanced view')}</Typography>
      <Switch
        checked={view === 'advanced'}
        onChange={handleChange}
        inputProps={{
          'aria-label': t('Switch to {{view}} view', { view: view === 'advanced' ? t('simple') : t('advanced') }),
          'data-testid': 'switch-markets-view',
        }}
      />
    </Box>
  );
};

export default AdvancedViewSwitch;
