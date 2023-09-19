import React, { FC } from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import { useCustomTheme } from 'contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Switch from 'components/Switch';

type Props = {
  sx?: BoxProps['sx'];
  fontSize?: number;
};

const AdvancedViewSwitch: FC<Props> = ({ sx, fontSize = 14 }) => {
  const { t } = useTranslation();
  const { view, setView } = useCustomTheme();

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={sx}>
      <Typography fontSize={fontSize}>{t('Advanced view')}</Typography>
      <Switch
        checked={view === 'advanced'}
        onChange={() => setView(view === 'advanced' ? 'simple' : 'advanced')}
        inputProps={{
          'aria-label': t('Switch to {{view}} view', { view: view === 'advanced' ? t('simple') : t('advanced') }),
          'data-testid': 'switch-markets-view',
        }}
      />
    </Box>
  );
};

export default AdvancedViewSwitch;
