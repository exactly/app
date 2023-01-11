import React, { useContext } from 'react';
import Image from 'next/image';
import { Skeleton, Typography } from '@mui/material';

import { MarketContext } from 'contexts/MarketContext';

import formatSymbol from 'utils/formatSymbol';
import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';

type AssetOptionProps = {
  assetSymbol?: string;
  option?: boolean;
};

function Asset({ assetSymbol, option = false }: AssetOptionProps) {
  const size = option ? 14 : 24;

  if (!assetSymbol) {
    return <Skeleton width={80} />;
  }

  return (
    <>
      <Image
        src={`/img/assets/${assetSymbol}.svg`}
        alt={formatSymbol(assetSymbol)}
        width={size}
        height={size}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      <Typography fontWeight={600} fontSize={option ? 16 : 24} mt={option ? '4px' : '6px'}>
        {formatSymbol(assetSymbol)}
      </Typography>
    </>
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
      renderValue={marketSymbol ? <Asset assetSymbol={marketSymbol} /> : null}
      renderOption={(o: string) => <Asset option assetSymbol={o} />}
    />
  );
}

export default React.memo(AssetSelector);
