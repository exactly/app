import React, { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Tooltip, Typography } from '@mui/material';

import handleOperationError from 'utils/handleOperationError';
import useAssets from 'hooks/useAssets';
import imageToBase64 from 'utils/imageToBase64';
import useAccountData from 'hooks/useAccountData';
import { useTranslation } from 'react-i18next';
import { track } from 'utils/segment';

const AddExaTokensButton = () => {
  const { t } = useTranslation();
  const { accountData } = useAccountData();
  const { connector } = useAccount();
  const assets = useAssets();

  const onClick = useCallback(async () => {
    if (!accountData) return;

    const imagesBase64: Record<string, string> = {};
    track('Button Clicked', {
      name: 'add exa vouchers',
      location: 'Dashboard',
    });

    await Promise.all(
      assets.map(
        async (asset) =>
          await imageToBase64(`img/exaTokens/exa${asset}.svg`).then(
            (base64) => (imagesBase64[asset] = base64 as string),
          ),
      ),
    );

    try {
      await Promise.all(
        accountData.map(
          ({ market, decimals, assetSymbol, symbol }) =>
            connector?.watchAsset?.({ address: market, decimals, symbol, image: imagesBase64[assetSymbol] }),
        ),
      );
    } catch (error) {
      handleOperationError(error);
    }
  }, [accountData, assets, connector]);

  return connector?.watchAsset ? (
    <Tooltip title={t('Add exaVouchers to Metamask')} placement="top" arrow>
      <Typography variant="link" onClick={onClick} sx={{ cursor: 'pointer' }}>
        + exaVouchers
      </Typography>
    </Tooltip>
  ) : null;
};

export default AddExaTokensButton;
