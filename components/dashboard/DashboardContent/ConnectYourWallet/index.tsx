import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';

function ConnectYourWallet() {
  const { connect } = useWeb3();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #E0E0E0',
        borderRadius: '6px',
        padding: '32px',
        gap: 1,
      }}
      mt={5}
    >
      <Typography fontWeight={700}>Connect your wallet</Typography>
      <Typography sx={{ textAlign: 'center', fontSize: '14px' }} color="grey.700">
        Please connect your wallet to see your deposits and borrowings.
      </Typography>
      <Button onClick={() => connect()} variant="contained" sx={{ marginTop: 1 }}>
        Connect wallet
      </Button>
    </Box>
  );
}

export default ConnectYourWallet;
