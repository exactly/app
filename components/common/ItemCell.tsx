import React from 'react';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';

type Props = {
  value: string;
  symbol?: string;
};

export default function ItemCell({ symbol, value }: Props) {
  return (
    <Box display="flex" alignItems="center" gap={0.5} sx={{ '&:not(:last-child)': { mb: 0.5 } }}>
      <Typography minWidth={90} variant="h5" component="p" fontWeight={700}>
        {value}
      </Typography>
      {symbol && (
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={symbol ?? ''}
          width={24}
          height={24}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      )}
    </Box>
  );
}
