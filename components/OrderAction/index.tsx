import React, { FC, useContext } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Grid from '@mui/material/Grid';

import ModalStatusContext from 'contexts/ModalStatusContext';
import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { useWeb3 } from 'hooks/useWeb3';

import keys from './translations.json';

const OrderAction: FC = () => {
  const { walletAddress, connect } = useWeb3();
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const handleAction = (action: 'deposit' | 'borrow' | 'depositAtMaturity') => {
    if (!walletAddress && connect) return connect();

    setOperation(action);
    setOpen(true);
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item>
          <Button variant="contained" onClick={() => handleAction('deposit')}>
            {translations[lang].deposit}
          </Button>
        </Grid>
        <Grid item display="flex">
          <Button variant="outlined" onClick={() => handleAction('borrow')}>
            {translations[lang].borrow}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderAction;
