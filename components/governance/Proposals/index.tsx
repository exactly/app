import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Proposals = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Divider flexItem />
      <Box display="flex" flexDirection="column" gap={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">{t('Proposals')}</Typography>
          <Typography
            fontSize={12}
            fontWeight={700}
            color="grey.100"
            sx={{ px: 0.5, py: 0.1, bgcolor: 'grey.900', borderRadius: '4px' }}
            textTransform="uppercase"
          >
            {t('Coming soon')}
          </Typography>
        </Box>
        <Typography fontSize={14} color="grey.500">
          {t(
            "Stay tuned to our Discord and Twitter for updates, and get ready to vote and shape the protocol's evolution.",
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default Proposals;
