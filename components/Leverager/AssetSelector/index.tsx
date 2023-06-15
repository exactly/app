import React, { FC } from 'react';
import DropdownMenu from 'components/DropdownMenu';
import AssetOption from 'components/asset/AssetOption';
import { Typography } from '@mui/material';

type AssetSelectorProps = {
  title: string;
  currentValue?: string;
  options: { symbol: string; value: string }[];
  onChange: (newValue: string) => void;
  disabled?: boolean;
};

const AssetSelector: FC<AssetSelectorProps> = ({ title, currentValue, options, onChange, disabled = false }) => {
  return (
    <DropdownMenu
      label={title}
      options={options}
      onChange={(newValue: { symbol: string; value: string }) => onChange(newValue.symbol)}
      disabled={disabled}
      renderValue={
        currentValue ? (
          <AssetOption assetSymbol={currentValue} />
        ) : (
          <Typography variant="h6" color="figma.grey.500">
            {title}
          </Typography>
        )
      }
      renderOption={({ symbol, value }: { symbol: string; value: string }) => (
        <AssetOption option assetSymbol={symbol} value={value} />
      )}
      data-testid="modal-asset-selector"
    />
  );
};

export default React.memo(AssetSelector);
