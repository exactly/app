import React, { FC } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';

import useActionButton from 'hooks/useActionButton';
import useAccountData from 'hooks/useAccountData';
import { useTranslation } from 'react-i18next';

type Props = {
  symbol: string;
};

const OrderAction: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const { handleActionClick } = useActionButton();

  return (
    <Box display="flex" gap={1}>
      <Button
        disabled={!marketAccount}
        variant="contained"
        onClick={(e) => handleActionClick(e, 'deposit', symbol)}
        fullWidth
      >
        {t('Deposit')}
      </Button>
      <Button
        disabled={!marketAccount}
        variant="outlined"
        onClick={(e) => handleActionClick(e, 'borrow', symbol)}
        fullWidth
      >
        {t('Borrow')}
      </Button>
    </Box>
  );
};

export default OrderAction;
