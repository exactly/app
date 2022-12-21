import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useWeb3Modal } from '@web3modal/react';

function ConnectYourWallet() {
  const { open } = useWeb3Modal();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      border="1px solid #E0E0E0"
      borderRadius="6px"
      p={4}
      mt={5}
      gap={1}
    >
      <Typography fontWeight={700}>Connect your wallet</Typography>
      <Typography textAlign="center" fontSize={14} color="grey.700">
        Please connect your wallet to see your deposits and borrowings.
      </Typography>
      <Button onClick={() => open()} variant="contained" sx={{ marginTop: 2 }}>
        Connect wallet
      </Button>
    </Box>
  );
}

export default ConnectYourWallet;
