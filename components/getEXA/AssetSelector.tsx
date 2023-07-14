import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import DropdownMenu from 'components/DropdownMenu';
import { Asset } from 'types/Bridge';
import { optimism } from 'wagmi/chains';
import { Box, Skeleton, Typography } from '@mui/material';
import Image from 'next/image';
import useBalance from 'hooks/useBalance';
import formatNumber from 'utils/formatNumber';
import { useGetEXA } from 'contexts/GetEXAContext';
import useSocketAssets from 'hooks/useSocketAssets';

type AssetOptionProps = {
  asset?: Asset;
  option?: boolean;
  optionSize?: number;
  selectedSize?: number;
  chainId: number;
};

function AssetOption({ asset, option = false, optionSize = 17, selectedSize = 14, chainId }: AssetOptionProps) {
  const size = option ? optionSize : selectedSize;
  const balance = useBalance(asset?.symbol, asset?.address as `0x${string}`, true, chainId);

  if (!asset) {
    return <Skeleton width={80} />;
  }

  return (
    <Box
      display="flex"
      gap={1}
      my={0.5}
      mx={option ? 0.5 : 0}
      alignContent="center"
      alignItems="center"
      justifyContent="center"
    >
      {asset.logoURI && (
        <Image
          src={asset.logoURI}
          alt={asset.symbol}
          width={size}
          height={size}
          style={{
            borderRadius: '100%',
          }}
        />
      )}
      <>
        {option ? (
          <>
            <Box display="flex" alignItems="center">
              <Box>
                <Typography fontWeight={600} fontSize={14} color="grey.900">
                  {asset.name}
                </Typography>
                <Typography fontSize={10} color="grey.900">
                  {asset.symbol}
                </Typography>
              </Box>
            </Box>
            <Box ml="auto">
              <Typography fontSize={8}>{balance && Number(balance) ? formatNumber(balance) : ''}</Typography>
            </Box>
          </>
        ) : (
          <Typography fontWeight={600} fontSize={14} color="grey.900">
            {asset.symbol}
          </Typography>
        )}
      </>
    </Box>
  );
}

function AssetSelector() {
  const { t } = useTranslation();
  const { setAsset, asset, chain } = useGetEXA();
  const assets = useSocketAssets();

  if (!assets) return null;

  return (
    <DropdownMenu
      label={t('Asset')}
      options={assets}
      onChange={setAsset}
      renderValue={<AssetOption asset={asset} chainId={chain?.chainId || optimism.id} />}
      renderOption={(o: Asset) => <AssetOption option asset={o} chainId={chain?.chainId || optimism.id} />}
      data-testid="modal-asset-selector"
    />
  );
}

export default memo(AssetSelector);
