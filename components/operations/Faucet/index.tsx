import React, { useCallback, useContext, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { parseFixed } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import Image from 'next/image';
import imageToBase64 from 'utils/imageToBase64';

import faucetAbi from './abi.json';

import AccountDataContext from 'contexts/AccountDataContext';
import useAssets from 'hooks/useAssets';

import { Box, Button, Divider, Typography } from '@mui/material';
import formatSymbol from 'utils/formatSymbol';
import { LoadingButton } from '@mui/lab';
import handleOperationError from 'utils/handleOperationError';

function Faucet() {
  const { data: signer } = useSigner();
  const { connector } = useAccount();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const [loading, setLoading] = useState<string | undefined>(undefined);
  const assets = useAssets();

  const mint = useCallback(
    async (symbol: string) => {
      if (!accountData) return;
      try {
        const { asset, decimals } = accountData[symbol];

        setLoading(symbol);
        const amounts: Record<string, string> = {
          DAI: '50000',
          USDC: '50000',
          WBTC: '2',
        };

        const faucet = new Contract('0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe', faucetAbi, signer ?? undefined);
        const tx = await faucet?.mint(asset, parseFixed(amounts[symbol], decimals));
        await tx.wait();

        void getAccountData();
      } catch {
        setLoading(undefined);
      } finally {
        setLoading(undefined);
      }
    },
    [accountData, getAccountData, signer],
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
      await Promise.all(
        Object.values(accountData)
          .filter(({ assetSymbol }) => assetSymbol !== 'WETH')
          .map(({ asset: address, decimals, assetSymbol: symbol }) =>
            connector?.watchAsset?.({ symbol, address, decimals, image: imagesBase64[symbol] }),
          ),
      );
    } catch (error) {
      handleOperationError(error);
    }
  }, [accountData, assets, connector]);

  return (
    <Box minWidth={{ xs: 200, sm: 350 }}>
      <Typography variant="link" onClick={addTokens} sx={{ cursor: 'pointer' }}>
        Add tokens to Metamask
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
                <Button variant="contained">Mint</Button>
              </a>
            ) : (
              <LoadingButton variant="contained" onClick={() => mint(asset)} loading={asset === loading}>
                Mint
              </LoadingButton>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default Faucet;
