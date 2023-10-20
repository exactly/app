import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { useWeb3 } from '../../hooks/useWeb3';

type Props = {
  onNextStep: () => void;
};

const Connect = ({ onNextStep }: Props) => {
  const { isConnected, connect } = useWeb3();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isConnected) return;
    onNextStep();
  }, [isConnected, onNextStep]);

  const handleClick = useCallback(() => {
    connect();
  }, [connect]);

  return (
    <>
      <Typography fontWeight={700} fontSize={24}>
        {t('Connect Wallet')}
      </Typography>
      <Box borderBottom="1px solid" borderColor="grey.200">
        <Typography mb={1}>
          {t('To use this feature, you need to have a deposit enabled as collateral in the Protocol.')}
        </Typography>
        <Typography mb={2}>
          {t('Connect your wallet to check if you have collateral already or to deposit assets.')}
        </Typography>
        <Button sx={{ mb: 6 }} variant="contained" onClick={handleClick} fullWidth>
          {t('Connect Wallet')}
        </Button>
      </Box>
      <Box mt={6}>
        <Typography mb={1} fontWeight={700}>
          {t('Why do I need to deposit assets?')}
        </Typography>
        <Typography mb={3}>
          {t(
            'Exactly operates as an overcollateralized, decentralized Protocol. This means you need to deposit assets as collateral to increase your borrowing limit. Learn more about how Exactly works here.',
          )}
        </Typography>
        <Typography mb={1} fontWeight={700}>
          {t('How do I deposit assets?')}
        </Typography>
        <Typography mb={3}>
          {t(
            'Connect a decentralized, funded wallet such as Metamask, Rainbow or Trust to deposit assets on the Protocol and enable them as collateral.',
          )}
        </Typography>
      </Box>
    </>
  );
};

export default Connect;
