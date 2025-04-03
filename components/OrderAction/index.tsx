import React, { FC, MouseEvent, useCallback } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';
import { useTranslation } from 'react-i18next';

import useActionButton from 'hooks/useActionButton';
import useAccountData from 'hooks/useAccountData';
import { track } from 'utils/mixpanel';

type Props = {
  symbol: string;
};

const OrderAction: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const { handleActionClick } = useActionButton();

  const handleDepositButtonClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      handleActionClick(e, 'deposit', symbol);
      track('Button Clicked', {
        name: 'deposit',
        location: 'Order Action',
        symbol,
      });
    },
    [handleActionClick, symbol],
  );

  const handleBorrowButtonClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      handleActionClick(e, 'borrow', symbol);
      track('Button Clicked', {
        name: 'borrow',
        location: 'Order Action',
        symbol,
      });
    },
    [handleActionClick, symbol],
  );
  return (
    <Box display="flex" gap={1}>
      <Button
        disabled={!marketAccount || symbol === 'USDC.e'}
        variant="contained"
        onClick={handleDepositButtonClick}
        fullWidth
        data-testid={`floating-deposit-${symbol}`}
      >
        {t('Deposit')}
      </Button>
      <Button
        disabled={!marketAccount || symbol === 'USDC.e'}
        variant="outlined"
        onClick={handleBorrowButtonClick}
        fullWidth
        data-testid={`floating-borrow-${symbol}`}
      >
        {t('Borrow')}
      </Button>
    </Box>
  );
};

export default React.memo(OrderAction);
