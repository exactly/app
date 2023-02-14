import React, { useState, PropsWithChildren } from 'react';
import { Button, Grid, Box, Typography } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';

type Props = {
  bgColor?: string;
};

function ModalAdvancedSettings({ children, bgColor }: PropsWithChildren & Props) {
  const [open, setOpen] = useState(false);

  return (
    <Grid container flexDirection="column" mt={-0.8}>
      <Grid item>
        <Button
          variant="text"
          disableRipple
          disableTouchRipple
          onClick={() => setOpen(!open)}
          sx={{
            '&:hover': { backgroundColor: 'transparent' },
            px: 1,
            py: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            height: 'fit-content',
          }}
        >
          <Typography fontWeight={500} color="grey.500" fontSize={14}>
            Advanced settings
          </Typography>
          {open ? (
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 12, color: 'grey.500' }} />
          ) : (
            <KeyboardArrowRightRoundedIcon sx={{ fontSize: 12, color: 'grey.500' }} />
          )}
        </Button>
      </Grid>
      {open && (
        <Grid item mt={1}>
          <Box sx={{ backgroundColor: bgColor || 'grey.100', py: 1, borderRadius: 1 }}>{children}</Box>
        </Grid>
      )}
    </Grid>
  );
}

export default React.memo(ModalAdvancedSettings);
