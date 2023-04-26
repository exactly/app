import React, { FC, useCallback, useMemo, useRef } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { atcb_action } from 'add-to-calendar-button';
import parseTimestamp from 'utils/parseTimestamp';
import { Operation } from 'contexts/ModalStatusContext';
import useTranslateOperation from 'hooks/useTranslateOperation';

type Props = {
  operation: Operation;
  maturity: number;
};

const Reminder: FC<Props> = ({ operation, maturity }) => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { palette } = useTheme();
  const buttonRef = useRef<HTMLInputElement>(null);

  const isBorrow = useMemo(() => operation?.startsWith('borrow'), [operation]);

  const onClick = useCallback(() => {
    const config = {
      name: t(`[Exactly] {{operationName}} maturity date reminder`, {
        operationName: translateOperation(operation, { capitalize: true, variant: 'noun' }),
      }),
      description: 'https://app.exact.ly/dashboard',
      startDate: parseTimestamp(maturity, 'YYYY-MM-DD'),
      startTime: '00:00',
      endTime: '00:00',
      options: ['Google', 'Apple', 'iCal', 'Microsoft365', 'MicrosoftTeams', 'Outlook.com', 'Yahoo'],
      timeZone: 'UTC',
      lightMode: palette.mode,
    };

    if (buttonRef.current) atcb_action(config as Parameters<typeof atcb_action>[0], buttonRef.current);
  }, [maturity, operation, palette.mode, t, translateOperation]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={1}
      py={3}
      px={4}
      borderRadius={1}
      border="1px solid #E3E5E8"
      data-testid="modal-transaction-reminder"
    >
      <Typography fontSize={15} fontWeight={700} data-testid="modal-transaction-reminder-title">
        {isBorrow ? t('Remember to pay before the maturity date') : t('Remember to withdraw your assets')}
      </Typography>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center">
        <Typography fontSize={13} fontWeight={500} color="figma.grey.600">
          {isBorrow ? t('You are borrowing from a fixed-rate pool.') : t('You are depositing to a fixed-rate pool.')}
        </Typography>
        {isBorrow && (
          <Typography fontSize={13} fontWeight={500} color="figma.grey.600">
            {t('Avoid penalties by paying your debt before the maturity date.')}
          </Typography>
        )}
      </Box>
      <Box mt={1}>
        <div ref={buttonRef}>
          <Button variant="contained" onClick={onClick}>
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <CalendarTodayIcon sx={{ fontSize: '15px' }} />
              <Typography fontSize={13} fontWeight={700}>
                {t('Add reminder to your calendar')}
              </Typography>
            </Box>
          </Button>
        </div>
      </Box>
    </Box>
  );
};

export default Reminder;
