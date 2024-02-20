import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';
import AssetOption from 'components/asset/AssetOption';
import { useOperationContext } from 'contexts/OperationContext';
import { track } from 'utils/mixpanel';

function AssetSelector() {
  const { t } = useTranslation();
  const { setQty, symbol, setSymbol } = useOperationContext();
  const options = useAssets();
  const handleClick = useCallback(
    (value: string) => {
      setQty('');
      setSymbol(value);

      track('Option Selected', {
        location: 'Operations Modal',
        name: 'asset',
        value,
        prevValue: symbol,
      });
    },
    [setQty, setSymbol, symbol],
  );

  return (
    <DropdownMenu
      label={t('Asset')}
      options={options}
      onChange={handleClick}
      renderValue={<AssetOption assetSymbol={symbol} />}
      renderOption={(o: string) => <AssetOption option assetSymbol={o} />}
      data-testid="modal-asset-selector"
    />
  );
}

export default React.memo(AssetSelector);
