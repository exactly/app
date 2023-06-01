import React from 'react';
import { Box, type BoxProps } from '@mui/material';

type Props = {
  type: 'fixed' | 'floating';
} & BoxProps;

function OperationSquare({ type, ...props }: Props) {
  return (
    <Box
      component="span"
      display="inline-block"
      width={16}
      height={16}
      borderRadius="4px"
      {...props}
      sx={[
        { bgcolor: type === 'floating' ? 'green' : 'blue' },
        ...(Array.isArray(props.sx) ? props.sx.flat() : [props.sx]),
      ]}
    />
  );
}

export default React.memo(OperationSquare);
