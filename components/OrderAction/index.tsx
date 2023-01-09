import React, { FC } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/system/Box';

import useActionButton from 'hooks/useActionButton';

type Props = {
  symbol: string;
};

const OrderAction: FC<Props> = ({ symbol }) => {
  const { handleActionClick } = useActionButton();

  return (
    <Box display="flex" gap={1}>
      <Button variant="contained" onClick={(e) => handleActionClick(e, 'deposit', symbol)} fullWidth>
        Deposit
      </Button>
      <Button variant="outlined" onClick={(e) => handleActionClick(e, 'borrow', symbol)} fullWidth>
        Borrow
      </Button>
    </Box>
  );
};

export default OrderAction;
