import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';

function ConnectYourWallet() {
  const { t } = useTranslation();
  const { connect } = useWeb3();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      border="1px solid #E0E0E0"
      borderRadius="6px"
      py={5}
      px={4}
      mt={5}
      gap={1}
      height="320px"
    >
      <Typography fontWeight={700} fontSize={16}>
        {t('Connect your wallet')}
      </Typography>
      <Typography textAlign="center" fontSize={14} color="figma.grey.500">
        {t('Please connect your wallet to see your deposits and borrowings.')}
      </Typography>
      <Button onClick={connect} variant="contained" sx={{ marginTop: 2 }}>
        {t('Connect wallet')}
      </Button>
    </Box>
  );
}

export default ConnectYourWallet;
