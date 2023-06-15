import React, { FC } from 'react';
import DropdownMenu from 'components/DropdownMenu';
import AssetOption from 'components/asset/AssetOption';
import { Typography } from '@mui/material';

type AssetSelectorProps = {
  title: string;
  value?: string;
  options: string[];
  onChange: (newValue: string) => void;
  disabled?: boolean;
};

const AssetSelector: FC<AssetSelectorProps> = ({ title, value, options, onChange, disabled = false }) => {
  return (
    <DropdownMenu
      label={title}
      options={options}
      onChange={(newValue: string) => onChange(newValue)}
      disabled={disabled}
      renderValue={
        value ? (
          <AssetOption assetSymbol={value} />
        ) : (
          <Typography variant="h6" color="figma.grey.500">
            {title}
          </Typography>
        )
      }
      renderOption={(o: string) => <AssetOption option assetSymbol={o} />}
      data-testid="modal-asset-selector"
    />
  );
};

export default React.memo(AssetSelector);
