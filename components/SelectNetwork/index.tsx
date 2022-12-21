import React, { FC } from 'react';
import { useWeb3 } from 'hooks/useWeb3';

import { Box, capitalize } from '@mui/material';

// TODO: Add network selector
const SelectNetwork: FC = () => {
  const { chain } = useWeb3();

  return (
    <Box my="auto">
      <Box>{capitalize((chain?.network === 'homestead' ? 'mainnet' : chain?.network) || '')}</Box>
    </Box>
  );
};

export default SelectNetwork;
