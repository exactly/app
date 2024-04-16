import React, { useCallback } from 'react';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import imageToBase64 from 'utils/imageToBase64';
import { useTranslation } from 'react-i18next';

import useAssets from 'hooks/useAssets';

import { Box, Button, Divider, Typography } from '@mui/material';
import formatSymbol from 'utils/formatSymbol';
import useAccountData from 'hooks/useAccountData';
import AssetMinter from './AssetMinter';

function Faucet() {
  const { t } = useTranslation();
  const { connector } = useAccount();
  const { accountData } = useAccountData();
  const assets = useAssets();

  const addTokens = useCallback(async () => {
    if (!accountData) return;

    const imagesBase64: Record<string, string> = {};

    await Promise.all(
      assets.map(
        async (asset) =>
          await imageToBase64(`img/assets/${asset}.svg`).then((base64) => (imagesBase64[asset] = base64 as string)),
      ),
    );

    try {
      const marketAccounts = accountData.filter((marketAccount) => marketAccount.assetSymbol !== 'WETH');
      await Promise.all(
        marketAccounts.flatMap((marketAccount) => {
          const { asset: address, decimals, assetSymbol: symbol } = marketAccount;
          return connector?.watchAsset?.({ symbol, address, decimals, image: imagesBase64[symbol] });
        }),
      );
    } catch {
      // ignore
    }
  }, [accountData, assets, connector]);

  return (
    <Box minWidth={{ xs: 200, sm: 350 }}>
      <Typography variant="link" onClick={addTokens} sx={{ cursor: 'pointer' }}>
        {t('Add tokens to Metamask')}
      </Typography>
      <Divider sx={{ my: 3 }} />
      <Box display="flex" flexDirection="column" gap={3}>
        {assets.map((asset) => (
          <Box key={`faucet_${asset}`} display="flex" justifyContent="space-between">
            <Box display="flex" gap={1.5}>
              <Image
                src={`/img/assets/${asset}.svg`}
                alt={asset}
                width={40}
                height={40}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              <Typography fontWeight="600" alignSelf="center">
                {formatSymbol(asset)}
              </Typography>
            </Box>
            {asset === 'WETH' ? (
              <a href={'https://www.alchemy.com/faucets/optimism-sepolia'} target="_blank" rel="noopener noreferrer">
                <Button variant="contained">{t('Mint')}</Button>
              </a>
            ) : (
              <AssetMinter symbol={asset} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default Faucet;
