import React, { memo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';

import { track } from 'utils/mixpanel';
import { EXA_BRIDGE_URL } from 'utils/const';

const HyperlaneBridge = () => {
  const { t } = useTranslation();

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'start', sm: 'center' }}
      justifyContent="space-between"
      gap={2}
      p={3}
      borderRadius={1}
      bgcolor="components.bg"
      boxShadow="0px 3px 4px 0px #61666B1A"
    >
      <Typography fontSize={16}>
        {t('Bridge your EXA tokens between OP Mainnet and Base, powered by Hyperlane.')}
      </Typography>
      <Button
        component="a"
        href={EXA_BRIDGE_URL}
        target="_blank"
        rel="noreferrer noopener"
        variant="contained"
        endIcon={<OpenInNewIcon sx={{ height: 14, width: 14 }} />}
        sx={{ whiteSpace: 'nowrap', minWidth: 168 }}
        onClick={() => track('Button Clicked', { location: 'Bridge', name: 'hyperlane bridge', href: EXA_BRIDGE_URL })}
      >
        {t('Bridge EXA')}
      </Button>
    </Box>
  );
};

export default memo(HyperlaneBridge);
