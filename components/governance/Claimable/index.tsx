import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { LoadingButton } from '@mui/lab';

const Claimable = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{t('Claimable')}</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Image
            src={`/img/assets/EXA.svg`}
            alt=""
            width={24}
            height={24}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <Typography variant="h6">0</Typography>
          <Typography fontSize={14} color="grey.700">
            $0
          </Typography>
        </Box>
      </Box>
      <LoadingButton variant="contained" fullWidth>
        {t('Claim EXA & Self Delegate Votes')}
      </LoadingButton>
      <Typography fontSize={14} color="grey.500">
        {t(
          'When claiming your EXA you are also delegating your voting power to yourself. You can always choose to delegate it to another address later on.',
        )}{' '}
        <a href="https://docs.exact.ly/" target="_blank" rel="noreferrer noopener">
          <u>{t('Learn more about delegation.')}</u>
        </a>
      </Typography>
      <Divider flexItem />
    </Box>
  );
};

export default Claimable;
