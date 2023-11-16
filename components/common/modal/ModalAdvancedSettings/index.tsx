import React, { useState, PropsWithChildren, useCallback } from 'react';
import { Button, Grid, Box, Typography, type GridProps } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import { useTranslation } from 'react-i18next';
import { track } from '../../../../utils/segment';

type Props = {
  bgColor?: string;
} & GridProps;

function ModalAdvancedSettings({ children, bgColor, ...props }: PropsWithChildren & Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(() => {
    setOpen(!open);
    track('Button Clicked', {
      location: 'Modal',
      name: 'advanced settings',
      value: !open,
      prevValue: open,
    });
  }, [open]);
  return (
    <Grid container flexDirection="column" {...props}>
      <Grid item>
        <Button
          variant="text"
          disableRipple
          disableTouchRipple
          onClick={handleClick}
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
          <Typography fontWeight={500} color="grey.500" fontSize={13}>
            {t('Advanced settings')}
          </Typography>
          {open ? (
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 11, color: 'grey.500', my: 'auto' }} />
          ) : (
            <KeyboardArrowRightRoundedIcon sx={{ fontSize: 11, color: 'grey.500', my: 'auto' }} />
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
