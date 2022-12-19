import React, { FC, useContext } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';

import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';
import { Operation, useModalStatus } from 'contexts/ModalStatusContext';

const OrderAction: FC = () => {
  const { walletAddress, connect } = useWeb3();
  const { openOperationModal } = useModalStatus();
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const handleAction = (action: Extract<Operation, 'deposit' | 'borrow' | 'depositAtMaturity'>) => {
    if (!walletAddress && connect) return connect();

    openOperationModal(action);
  };

  return (
    <Box display="flex" gap={1}>
      <Button variant="contained" onClick={() => handleAction('deposit')} fullWidth>
        {translations[lang].deposit}
      </Button>
      <Button variant="outlined" onClick={() => handleAction('borrow')} fullWidth>
        {translations[lang].borrow}
      </Button>
    </Box>
  );
};

export default OrderAction;
