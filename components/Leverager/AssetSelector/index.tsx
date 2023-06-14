import React, { FC } from 'react';
import DropdownMenu from 'components/DropdownMenu';
import AssetOption from 'components/asset/AssetOption';
import { Typography } from '@mui/material';

type AssetSelectorProps = {
  title: string;
  value?: string;
  options: string[];
  onChange: (newValue: string) => void;
};

const AssetSelector: FC<AssetSelectorProps> = ({ title, value, options, onChange }) => {
  return (
    <DropdownMenu
      label={title}
      options={options}
      onChange={(newValue: string) => onChange(newValue)}
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
