import React from 'react';

import Button, { type ButtonProps } from '@mui/material/Button';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { Typography } from '@mui/material';

type Props = {
  selected?: boolean;
} & ButtonProps;

function ModalSheetButton({ selected = false, children, ...props }: Props) {
  return (
    <Button
      {...props}
      sx={[
        { display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5, borderRadius: 1 },
        ...(Array.isArray(props.sx) ? props.sx.flat() : [props.sx]),
      ]}
    >
      <Typography
        display="flex"
        alignItems="center"
        gap={0.5}
        fontWeight={700}
        fontSize={19}
        color={selected ? 'grey.900' : 'figma.grey.500'}
      >
        {children}
      </Typography>
      <KeyboardArrowDownRoundedIcon sx={{ width: 16, height: 16, color: 'figma.grey.500' }} />
    </Button>
  );
}

export default React.memo(ModalSheetButton);
