import { Box, Typography } from '@mui/material';
import React, { FC } from 'react';

export type StrategyTagProps = {
  text: string;
  prefix?: string;
  size?: 'small' | 'medium';
};

const StrategyTag: FC<StrategyTagProps> = ({ text, prefix, size = 'medium' }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={1}
      borderRadius="4px"
      border={({ palette }) => `1px solid ${palette.grey[300]}`}
      px={1}
      minWidth={size === 'small' ? 96 : 168}
    >
      {prefix && (
        <Typography fontFamily="IBM Plex Mono" fontSize={12} fontWeight={500} textTransform="uppercase">
          {prefix}
        </Typography>
      )}
      <Typography fontSize={16} fontWeight={700}>
        {text}
      </Typography>
    </Box>
  );
};

export default React.memo(StrategyTag);
