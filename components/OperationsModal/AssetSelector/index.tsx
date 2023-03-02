import React, { useContext } from 'react';
import Image from 'next/image';
import { Box, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';

import { MarketContext } from 'contexts/MarketContext';

import formatSymbol from 'utils/formatSymbol';
import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';

type AssetOptionProps = {
  assetSymbol?: string;
  option?: boolean;
};

function Asset({ assetSymbol, option = false }: AssetOptionProps) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const size = option ? 20 : 24;

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
      <Typography
        variant="browserAlign"
        fontWeight={700}
        fontSize={size}
        height={size}
        lineHeight={isMobile ? 1.2 : undefined}
      >
        {formatSymbol(assetSymbol)}
      </Typography>
    </Box>
  );
}

function AssetSelector() {
  const { marketSymbol, setMarketSymbol } = useContext(MarketContext);
  const options = useAssets();

  return (
    <DropdownMenu
      label="Asset"
      options={options}
      onChange={setMarketSymbol}
      renderValue={<Asset assetSymbol={marketSymbol} />}
      renderOption={(o: string) => <Asset option assetSymbol={o} />}
    />
  );
}

export default React.memo(AssetSelector);
