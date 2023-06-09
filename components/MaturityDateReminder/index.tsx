import React, { useCallback, useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Alert, Slide, SlideProps } from '@mui/material';
import useAccountData from 'hooks/useAccountData';
import parseTimestamp from 'utils/parseTimestamp';

export default function MaturityDateReminder() {
  const { t } = useTranslation();
  const { accountData } = useAccountData();
  const [openReminder, setOpenReminder] = useState<boolean>(false);
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    if (!accountData) return;

    accountData.forEach((fixedLender) => {
      fixedLender.fixedBorrowPositions.forEach((borrowPosition) => {
        const { maturity } = borrowPosition;

        const secondsInADay = 86_400n;
        const rangeInSeconds = secondsInADay * 5n;
        const currentTimestamp = BigInt(dayjs().unix());

        if (maturity > currentTimestamp) {
          const differenceInSeconds = maturity - currentTimestamp;

          if (rangeInSeconds > differenceInSeconds) {
            setDate(parseTimestamp(maturity.toString(), 'MMM DD, YYYY, HH:mm:ss'));
            setOpenReminder(true);
          }
        }
      });
    });
  }, [accountData]);

  const handleClose = useCallback(() => {
    setOpenReminder(false);
  }, []);

  function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="down" />;
  }

  return openReminder ? (
    <Snackbar
      open={openReminder}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="warning">
        {t('Make sure to repay your fixed borrows before {{date}} to avoid penalty fees.', { date })}
      </Alert>
    </Snackbar>
  ) : null;
}
