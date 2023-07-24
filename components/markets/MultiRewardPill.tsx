import React, { type PropsWithChildren } from 'react';
import { Box, Chip, Typography } from '@mui/material';

type Props = {
  rate: string;
};

function MultiRewardPill({ rate, children }: PropsWithChildren<Props>) {
  return (
    <Chip
      label={
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography fontWeight={500} fontSize={11}>
            {rate}
          </Typography>
          {children}
        </Box>
      }
      size="small"
      sx={{
        padding: '4px 6px 4px 8px',
        border: ({ palette }) => `1px solid ${palette.grey[200]}`,
        backgroundColor: 'grey.100',
        color: 'grey.700',
        '& .MuiChip-label': {
          p: 0,
        },
      }}
    />
  );
}

export default React.memo(MultiRewardPill);
