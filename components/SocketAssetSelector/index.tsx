import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import DropdownMenu from 'components/DropdownMenu';
import { type AssetBalance } from 'types/Bridge';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import formatNumber from 'utils/formatNumber';

type AssetOptionProps = {
  asset: AssetBalance;
  option?: boolean;
  optionSize?: number;
  selectedSize?: number;
};

function AssetOption({ asset, option = false, optionSize = 20, selectedSize = 20 }: AssetOptionProps) {
  const size = option ? optionSize : selectedSize;

  return (
    <Box display="flex" gap={1} my={0.5} mx={option ? 0.5 : 0} alignItems="center" flex={1}>
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
      <Box display="flex" justifyContent={'space-between'} alignItems={'center'} gap={1} flex={1}>
        {option ? (
          <>
            <Box display="flex" alignItems="center" flex={1}>
              <Box>
                <Typography fontWeight={600} fontSize={14} color="grey.900">
                  {asset.name}
                </Typography>
                <Typography fontSize={10} color="grey.900">
                  {asset.symbol}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography fontSize={12}>{asset.amount && formatNumber(asset.amount)}</Typography>
            </Box>
          </>
        ) : (
          <Typography fontWeight={500} fontSize={16} color="grey.900">
            {asset.symbol}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

type Props = {
  options: AssetBalance[];
  onChange: (asset: AssetBalance) => void;
  asset: AssetBalance;
  disabled?: boolean;
};

function SocketAssetSelector({ options, onChange, asset, disabled = false }: Props) {
  const { t } = useTranslation();

  return (
    <DropdownMenu
      label={t('Asset')}
      options={options}
      onChange={onChange}
      renderValue={<AssetOption asset={asset} />}
      renderOption={(o: AssetBalance) => <AssetOption option asset={o} />}
      disabled={disabled}
    />
  );
}

export default memo(SocketAssetSelector);
