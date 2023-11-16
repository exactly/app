import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';

type Props = {
  onNextStep: () => void;
};

const Welcome = ({ onNextStep }: Props) => {
  const { t } = useTranslation();
  return (
    <>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography fontSize={24} fontWeight={700}>
          {t('Debit to Credit')}
        </Typography>
        <Box>
          <Typography fontSize={16} fontWeight={500} mb={2}>
            {t(
              'Transform your current crypto-funded debit card into a credit card by getting a borrow on USDC at a fixed rate.',
            )}
          </Typography>
        </Box>
      </Box>
      <Box display="flex" mb={2} gap={2} flexDirection="column">
        <Box display="flex" flexDirection="column" minWidth={200} flex={1}>
          <Typography fontSize={16} fontWeight={700}>
            {t('Choose when to repay')}
          </Typography>
          <Typography fontSize={16} fontWeight={500}>
            {t('It could be up to 6 months with fixed interest rates.')}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" minWidth={200} flex={1}>
          <Typography fontSize={16} fontWeight={700}>
            {t('Earn passive yield')}
          </Typography>
          <Typography fontSize={16} fontWeight={500}>
            {t(
              "As soon as you deposit collateral, you'll start earning annual interest on it plus some extra rewards.",
            )}
          </Typography>
        </Box>
      </Box>
      <Button variant="contained" onClick={onNextStep} sx={{ mt: 4 }}>
        {t('Get Started')}
      </Button>
    </>
  );
};

export default Welcome;
