import React, { useContext } from 'react';
import Image from 'next/image';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { MarketContext } from 'contexts/MarketContext';

import formatSymbol from 'utils/formatSymbol';
import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';

type AssetOptionProps = {
  assetSymbol?: string;
  option?: boolean;
};

function Asset({ assetSymbol, option = false }: AssetOptionProps) {
  const size = option ? 17 : 21;

  if (!assetSymbol) {
    return <Skeleton width={80} />;
  }

  return (
    <Box display="flex" gap={1} my={0.5} mx={option ? 0.5 : 0} alignContent="center" justifyContent="center">
      <Image
        src={`/img/assets/${assetSymbol}.svg`}
        alt={formatSymbol(assetSymbol)}
        width={size}
        height={size}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <Typography fontWeight={700} fontSize={size} color="grey.900">
        {formatSymbol(assetSymbol)}
      </Typography>
    </Box>
  );
}

function AssetSelector() {
  const { t } = useTranslation();
  const { marketSymbol, setMarketSymbol } = useContext(MarketContext);
  const options = useAssets();

  return (
    <DropdownMenu
      label={t('Asset')}
      options={options}
      onChange={setMarketSymbol}
      renderValue={<Asset assetSymbol={marketSymbol} />}
      renderOption={(o: string) => <Asset option assetSymbol={o} />}
      data-testid="modal-asset-selector"
    />
  );
}

export default React.memo(AssetSelector);
