import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type SxProps, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { track } from 'utils/mixpanel';
import { useWeb3 } from 'hooks/useWeb3';
import useReadOnly from 'hooks/useReadOnly';
import { AccountInput } from 'components/AccountInput';
import Switch from 'components/Switch';

const ReadOnlySwitch: FC<{
  sx?: SxProps;
  fontSize?: number;
  onSubmit?: () => void;
}> = ({ sx, fontSize = 14, onSubmit }) => {
  const { t } = useTranslation();
  const { isReadOnly, toggle } = useReadOnly();
  const { breakpoints } = useTheme();
  const { impersonateActive } = useWeb3();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const handleChange = useCallback(() => {
    toggle();
    track('Option Selected', {
      name: 'read only',
      location: 'Settings',
      value: !isReadOnly,
      prevValue: isReadOnly,
    });
  }, [toggle, isReadOnly]);

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={sx}>
        <Typography fontSize={fontSize}>{t('Read-only mode')}</Typography>
        <Switch
          checked={isReadOnly}
          onChange={handleChange}
          inputProps={{
            'aria-label': t('Switch Read Only mode {{state}} ', { state: isReadOnly ? t('off') : t('on') }),
            'data-testid': 'switch-markets-view',
          }}
        />
      </Box>
      {isReadOnly && isMobile && !impersonateActive && <AccountInput fullWidth onSubmit={onSubmit} />}
    </>
  );
};

export default ReadOnlySwitch;
