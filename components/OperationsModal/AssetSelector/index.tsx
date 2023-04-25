import React from 'react';
import { useTranslation } from 'react-i18next';

import { useMarketContext } from 'contexts/MarketContext';

import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';
import AssetOption from 'components/asset/AssetOption';
import { useOperationContext } from 'contexts/OperationContext';

function AssetSelector() {
  const { t } = useTranslation();
  const { marketSymbol, setMarketSymbol } = useMarketContext();
  const { setQty } = useOperationContext();
  const options = useAssets();

  return (
    <DropdownMenu
      label={t('Asset')}
      options={options}
      onChange={(value: string) => {
        setQty('');
        setMarketSymbol(value);
      }}
      renderValue={<AssetOption assetSymbol={marketSymbol} />}
      renderOption={(o: string) => <AssetOption option assetSymbol={o} />}
      data-testid="modal-asset-selector"
    />
  );
}

export default React.memo(AssetSelector);
