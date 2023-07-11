import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';

function ConnectWalletGovernance() {
  const { t } = useTranslation();
  const { connect } = useWeb3();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      border="1px solid #E3E5E8"
      borderRadius="6px"
      py={4}
      px={5}
      gap={2}
      height={264}
    >
      <Typography fontWeight={700} fontSize={16}>
        {t('EXA token holder?')}
      </Typography>
      <Typography textAlign="center" fontSize={14} color="figma.grey.500">
        {t('Connect your wallet to check for EXA tokens and start participating in the protocol’s Governance.')}
      </Typography>
      <Button onClick={connect} variant="contained" sx={{ marginTop: 1 }}>
        {t('Connect wallet')}
      </Button>
    </Box>
  );
}

export default ConnectWalletGovernance;
