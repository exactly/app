import React, { FC, useContext, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';

import ModalStatusContext from 'contexts/ModalStatusContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

type OrderOrDepositProps = {
  showActions: boolean;
};

const OrderOrDeposit: FC<OrderOrDepositProps> = ({ showActions }) => {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  if (showActions) return <>{translations[lang].deposit}</>;
  return (
    <>
      {translations[lang].order}
      <PlayArrowIcon sx={{ ml: 3 }} />
    </>
  );
};

function OrderAction() {
  const { walletAddress, connect } = useWeb3Context();
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const [showActions, setShowActions] = useState(false);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const handleAction = (action: 'deposit' | 'borrow' | 'depositAtMaturity') => {
    if (!walletAddress && connect) return connect();

    setOperation(action);
    setOpen(true);
  };

  return (
    <Box
      className={styles.container}
      onMouseLeave={() => setShowActions(false)}
      onMouseOver={() => setShowActions(true)}
    >
      <Grid container spacing={2}>
        <Grid item>
          <Button variant="contained" onClick={() => handleAction('deposit')}>
            <OrderOrDeposit showActions={showActions} />
          </Button>
        </Grid>
        <Grid item display={showActions ? 'flex' : 'none'}>
          <Collapse in={showActions} orientation="horizontal" collapsedSize={0}>
            <Box sx={{ display: 'flex' }}>
              <Button variant="outlined" onClick={() => handleAction('borrow')}>
                {translations[lang].borrow}
              </Button>
              <IconButton
                onClick={() => handleAction('depositAtMaturity')}
                sx={{ backgroundColor: 'white', ml: 2 }}
                size="small"
              >
                <AddIcon color="primary" />
              </IconButton>
            </Box>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
}

export default OrderAction;
