import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Skeleton, Typography } from '@mui/material';
import DropdownMenu from 'components/DropdownMenu';
import { useGetEXA } from 'contexts/GetEXAContext';
import Image from 'next/image';
import { Chain } from 'types/Bridge';
type AssetOptionProps = {
  chain?: Chain;
  option?: boolean;
  optionSize?: number;
  selectedSize?: number;
};

function ChainOption({ chain, option = false, optionSize = 17, selectedSize = 14 }: AssetOptionProps) {
  const size = option ? optionSize : selectedSize;

  if (!chain) {
    return <Skeleton width={80} />;
  }

  return (
    <Box
      display="flex"
      gap={0.5}
      my={0.5}
      mx={option ? 0.5 : 0}
      alignContent="center"
      alignItems="center"
      justifyContent="center"
    >
      {chain.icon && (
        <Image
          src={chain.icon}
          alt={chain.name}
          width={size}
          height={size}
          style={{
            borderRadius: '100%',
          }}
        />
      )}
      <Typography fontWeight={600} fontSize={size} color="grey.900">
        {chain.name}
      </Typography>
    </Box>
  );
}

const ChainSelector = ({ disabled }: { disabled?: boolean }) => {
  const { t } = useTranslation();

  const { setChain: onChainChange, chains, chain } = useGetEXA();

  const handleChainChange = useCallback(
    (value: string) => {
      const c = chains?.find(({ name }) => value === name);
      if (c) onChainChange(c);
    },
    [chains, onChainChange],
  );

  if (!chains) return <Skeleton width={100} />;
  if (disabled) return <ChainOption chain={chain} />;

  return (
    <DropdownMenu
      label={t('Asset')}
      options={chains.map(({ name }) => name)}
      onChange={handleChainChange}
      renderValue={<ChainOption chain={chain} />}
      renderOption={(o: string) => <ChainOption option chain={chains.find(({ name }) => o === name)} />}
      data-testid="get-exa-chain"
      disabled={disabled}
    />
  );
};

export default memo(ChainSelector);
