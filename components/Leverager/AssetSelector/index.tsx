import React, { FC } from 'react';
import DropdownMenu from 'components/DropdownMenu';
import AssetOption from 'components/asset/AssetOption';
import { Typography } from '@mui/material';

type AssetSelectorOption = {
  symbol: string;
  value: string;
};

type AssetSelectorProps = {
  title: string;
  currentValue?: string;
  options: AssetSelectorOption[];
  onChange: (newValue: string) => void;
  disabled?: boolean;
  'data-testid'?: string;
};

const AssetSelector: FC<AssetSelectorProps> = ({
  title,
  currentValue,
  options,
  onChange,
  'data-testid': testId,
  disabled = false,
}) => {
  return (
    <DropdownMenu
      label={title}
      options={options}
      onChange={(newValue: AssetSelectorOption) => onChange(newValue.symbol)}
      disabled={disabled}
      renderValue={
        currentValue ? (
          <AssetOption assetSymbol={currentValue} unformattedSymbol={true} />
        ) : (
          <Typography variant="h6" color="figma.grey.500">
            {title}
          </Typography>
        )
      }
      renderOption={({ symbol, value }: AssetSelectorOption) => (
        <AssetOption
          option
          assetSymbol={symbol}
          value={value}
          unformattedSymbol={true}
          data-testid={`${testId}-${symbol}`}
        />
      )}
      data-testid={testId}
    />
  );
};

export default React.memo(AssetSelector);
