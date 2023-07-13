import React, { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';
import { Asset, Chain } from 'types/Bridge';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import { formatUnits } from 'viem';

type Props = { asset: Asset; amount: number; mobile?: boolean; chains: Chain[] };

const AssetAmount = ({ asset, amount, mobile, chains }: Props) => {
  const chain = useMemo(() => {
    if (!chains) return;
    return chains.find(({ chainId }) => chainId === asset.chainId);
  }, [asset.chainId, chains]);
  return (
    <Box display={'flex'} flexDirection={'column'} gap={1.5}>
      <Box display={'flex'} alignItems={'center'} height={16} gap={0.5}>
        <Image
          src={asset.logoURI}
          alt={asset.symbol}
          width={mobile ? 24 : 16}
          height={mobile ? 24 : 16}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography
          variant="body1"
          fontSize={mobile ? '19px' : '14px'}
          whiteSpace={'nowrap'}
          fontWeight={mobile ? 500 : 600}
        >
          {formatNumber(formatUnits(BigInt(amount), asset.decimals))} {asset.symbol}
        </Typography>
      </Box>
      <Box display={'flex'} alignItems={'center'} height={16} gap={0.5}>
        <Image
          src={chain?.icon || ''}
          alt={asset.symbol}
          width={16}
          height={16}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '100%',
          }}
        />
        <Typography variant="body1" fontSize={'14px'} fontWeight={600}>
          {chain?.name}
        </Typography>
      </Box>
    </Box>
  );
};

export default memo(AssetAmount);
