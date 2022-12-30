import React, { useContext, useMemo } from 'react';
import Image from 'next/image';
import { Skeleton, Typography } from '@mui/material';

import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import formatSymbol from 'utils/formatSymbol';
import { Address } from 'types/Address';
import DropdownMenu from 'components/DropdownMenu';

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
  const { market, setMarket } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  const options = useMemo<Record<Address, { value: Address; assetSymbol: string }>>(() => {
    if (!accountData) return {};

    const ret: Record<Address, { value: Address; assetSymbol: string }> = {};

    Object.values(accountData).forEach(({ assetSymbol, market: marketAddress }) => {
      ret[marketAddress] = { value: marketAddress, assetSymbol: assetSymbol };
    });

    return ret;
  }, [accountData]);

  return (
    <DropdownMenu
      label="Asset"
      options={Object.keys(options)}
      onChange={setMarket}
      renderValue={market ? <Asset assetSymbol={options[market]?.assetSymbol} /> : null}
      renderOption={(o: string) => <Asset option assetSymbol={options[o]?.assetSymbol} />}
    />
  );
}

export default React.memo(AssetSelector);
