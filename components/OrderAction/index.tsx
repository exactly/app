import { FC, useContext, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';

import ModalStatusContext from 'contexts/ModalStatusContext';
import LangContext from 'contexts/LangContext';

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
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const [showActions, setShowActions] = useState(false);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const handleAction = (action: 'deposit' | 'borrow') => {
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
        <Grid item display={showActions ? '' : 'none'}>
          <Collapse in={showActions} orientation="horizontal" collapsedSize={0}>
            <Button variant="outlined" onClick={() => handleAction('borrow')}>
              {translations[lang].borrow}
            </Button>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
}

export default OrderAction;
