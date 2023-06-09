import React, { useCallback, useState } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import Image from 'next/image';
import imageToBase64 from 'utils/imageToBase64';
import { useTranslation } from 'react-i18next';
import { parseUnits } from 'viem';

import useAssets from 'hooks/useAssets';

import { Box, Button, Divider, Typography } from '@mui/material';
import formatSymbol from 'utils/formatSymbol';
import { LoadingButton } from '@mui/lab';
import useAccountData from 'hooks/useAccountData';
import { abi } from './abi';

function Faucet() {
  const { t } = useTranslation();
  const { connector } = useAccount();
  const { accountData, getMarketAccount, refreshAccountData } = useAccountData();
  const [loading, setLoading] = useState<string | undefined>(undefined);
  const assets = useAssets();

  const { data, write } = useContractWrite({
    address: '0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe',
    abi,
    functionName: 'mint',
  });

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSettled: async () => {
      await refreshAccountData();
      setLoading(undefined);
    },
  });

  const mint = useCallback(
    async (symbol: string) => {
      const marketAccount = getMarketAccount(symbol);
      if (!marketAccount) return;
      try {
        const { asset, decimals } = marketAccount;

        setLoading(symbol);
        const amounts: Record<string, `${number}`> = {
          DAI: '50000',
          USDC: '50000',
          WBTC: '2',
        };

        write({ args: [asset, parseUnits(amounts[symbol], decimals)] });
      } catch {
        setLoading(undefined);
      }
    },
    [getMarketAccount, write],
  );

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
            {asset === 'WETH' || asset === 'wstETH' ? (
              <a
                href={asset === 'wstETH' ? 'https://stake.testnet.fi/' : 'https://goerlifaucet.com/'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="contained">{t('Mint')}</Button>
              </a>
            ) : (
              <LoadingButton variant="contained" onClick={() => mint(asset)} loading={isLoading && asset === loading}>
                {t('Mint')}
              </LoadingButton>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default Faucet;
