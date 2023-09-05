import React from 'react';
import { Box, Typography } from '@mui/material';

type Props = { text: string };

const Pill = React.forwardRef(function Pill({ text }: Props, ref) {
  return (
    <Box
      ref={ref}
      width="fit-content"
      display="flex"
      alignItems="center"
      height="17px"
      p={0.5}
      borderRadius="4px"
      bgcolor="green"
    >
      <Typography fontSize={12} fontWeight={700} color="components.bg" textAlign="center" textTransform="uppercase">
        {text}
      </Typography>
    </Box>
  );
});

export default Pill;
