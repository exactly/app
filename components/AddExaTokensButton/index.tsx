import React, { useCallback, useContext } from 'react';
import { useAccount } from 'wagmi';
import { Tooltip, Typography } from '@mui/material';

import AccountDataContext from 'contexts/AccountDataContext';
import handleOperationError from 'utils/handleOperationError';

const AddExaTokensButton = () => {
  const { accountData } = useContext(AccountDataContext);
  const { connector } = useAccount();

  const onClick = useCallback(async () => {
    if (!accountData) return;
    try {
      await Promise.all(
        Object.values(accountData).map(({ market, decimals, symbol }) =>
          connector?.watchAsset?.({ address: market, decimals, symbol }),
        ),
      );
    } catch (error) {
      handleOperationError(error);
    }
  }, [accountData, connector]);

  return connector?.watchAsset ? (
    <Tooltip title="Add exaTokens to Metamask" placement="top" arrow>
      <Typography variant="link" onClick={onClick}>
        + exaTokens
      </Typography>
    </Tooltip>
  ) : null;
};

export default AddExaTokensButton;
