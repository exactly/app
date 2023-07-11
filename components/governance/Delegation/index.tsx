import React from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';

const Delegation = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Divider flexItem />
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h6">{t('Votes Delegation')}</Typography>
        <Typography fontSize={14}>
          <Trans
            i18nKey="You have a total of <1>{{amount}} voting power</1> available to delegate."
            components={{
              1: <strong></strong>,
            }}
            values={{ amount: '4,785' }}
          />
        </Typography>
      </Box>
      <Button variant="contained" fullWidth>
        {t('Delegate Votes')}
      </Button>
    </Box>
  );
};

export default Delegation;
