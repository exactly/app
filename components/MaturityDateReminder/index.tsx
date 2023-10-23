import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Alert, Box, IconButton, Slide, SlideProps } from '@mui/material';
import useAccountData from 'hooks/useAccountData';
import parseTimestamp from 'utils/parseTimestamp';
import CloseIcon from '@mui/icons-material/Close';

const SECONDS_IN_A_DAY = 86400n;
const RANGE_IN_SECONDS = SECONDS_IN_A_DAY * 5n;

export default function MaturityDateReminder() {
  const { t } = useTranslation();
  const { accountData } = useAccountData();
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const [date] = useMemo(
    () =>
      accountData
        ? accountData.flatMap(({ fixedBorrowPositions }) =>
            fixedBorrowPositions.map(({ maturity }) => {
              const currentTimestamp = BigInt(dayjs().unix());
              if (maturity <= currentTimestamp) return;
              const differenceInSeconds = maturity - currentTimestamp;
              if (RANGE_IN_SECONDS <= differenceInSeconds) return;
              return parseTimestamp(maturity.toString(), 'MMM DD, YYYY, HH:mm:ss');
            }),
          )
        : [],
    [accountData],
  );

  useEffect(() => setIsReminderOpen(!!date), [date]);

  const handleClose = useCallback(() => {
    setIsReminderOpen(false);
  }, []);

  function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="down" />;
  }

  console.log({ isReminderOpen, date });

  return isReminderOpen ? (
    <Snackbar
      open={isReminderOpen}
      autoHideDuration={10_000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="warning" sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box>{t('Make sure to repay your fixed borrows before {{date}} to avoid penalty fees.', { date })}</Box>
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Alert>
    </Snackbar>
  ) : null;
}
