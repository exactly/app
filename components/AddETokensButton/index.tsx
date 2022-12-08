import React, { useCallback, useContext } from 'react';

import { useWeb3Context } from 'contexts/Web3Context';

import styles from './style.module.scss';

import { Tooltip } from '@mui/material';
import AccountDataContext from 'contexts/AccountDataContext';

function AddETokensButton() {
  const { web3Provider } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  return (
    <Tooltip title="Add eTokens to Metamask" placement="top" arrow>
      <p
        className={styles.addAssets}
        onClick={useCallback(async () => {
          if (!accountData) return;
          try {
            await Promise.all(
              Object.values(accountData).map(({ market, decimals, assetSymbol }) =>
                web3Provider?.provider.request?.({
                  method: 'wallet_watchAsset',
                  // @ts-expect-error bad typing
                  params: { type: 'ERC20', options: { address: market, decimals, symbol: `e${assetSymbol}` } },
                }),
              ),
            );
          } catch (error: any) {
            if (error.code !== 4001) throw error;
          }
        }, [accountData, web3Provider?.provider])}
      >
        + eTokens
      </p>
    </Tooltip>
  );
}

export default AddETokensButton;
