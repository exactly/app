import React, { FC, useContext } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import Grid from '@mui/material/Grid';

import ModalStatusContext from 'contexts/ModalStatusContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

const OrderAction: FC = () => {
  const { walletAddress, connect } = useWeb3Context();
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const handleAction = (action: 'deposit' | 'borrow' | 'depositAtMaturity') => {
    if (!walletAddress && connect) return connect();

    setOperation(action);
    setOpen(true);
  };

  return (
    <Box className={styles.container}>
      <Grid container spacing={2}>
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
