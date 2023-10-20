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
          <Typography fontSize={16} fontWeight={500} mb={1}>
            {t(
              'Transform your current crypto-funded debit card into a credit card by getting a borrow on USDC at a fixed interest rate on the Protocol.',
            )}
          </Typography>
          <Typography fontSize={16} fontWeight={500} mb={2}>
            {t("In just a few steps you'll be able to finish the process and take advantage of a true DeFi solution.")}
          </Typography>
        </Box>
      </Box>
      <Box display="flex" mb={2} gap={2} flexWrap="wrap">
        <Box display="flex" flexDirection="column" minWidth={200} flex={1} alignItems="center">
          <Typography fontSize={16} fontWeight={700} mb={2} mt={2}>
            {t('Choose when to repay')}
          </Typography>
          <Typography fontSize={16} fontWeight={500} textAlign="center">
            {t('It could be in 28 days or even in 140 days with low interest rates.')}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" minWidth={200} flex={1} alignItems="center">
          <Typography fontSize={16} fontWeight={700} mb={2} mt={2}>
            {t('Earn passive yield')}
          </Typography>
          <Typography fontSize={16} fontWeight={500} textAlign="center">
            {t(
              "As soon as you deposit collateral, you'll start earning annual interest on it plus some extra rewards.",
            )}
          </Typography>
        </Box>
      </Box>
      <Button variant="contained" onClick={onNextStep} sx={{ mt: 'auto' }}>
        {t('Get Started')}
      </Button>
    </>
  );
};

export default Welcome;
