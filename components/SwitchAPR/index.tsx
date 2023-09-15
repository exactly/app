import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Switch from 'components/Switch';
import { useCustomTheme } from 'contexts/ThemeContext';

type Props = {
  sx?: React.ComponentProps<typeof Box>['sx'];
  fontSize?: number;
};

const SwitchAPR: FC<Props> = ({ sx, fontSize = 14 }) => {
  const { t } = useTranslation();
  const { showAPR, setShowAPR } = useCustomTheme();

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={{ ...sx }}>
      <Typography fontSize={fontSize}>{t('APR / APY')}</Typography>
      <Switch
        checked={!showAPR}
        onChange={() => setShowAPR(!showAPR)}
        inputProps={{
          'aria-label': t('APR / APY'),
          'data-testid': 'switch-markets-view',
        }}
      />
    </Box>
  );
};

export default SwitchAPR;
