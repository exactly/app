import React, { FC, useCallback, useMemo, useRef } from 'react';
import { Box, Button, capitalize, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { atcb_action } from 'add-to-calendar-button';
import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  operationName: string;
  maturity: number;
};

const Reminder: FC<Props> = ({ operationName, maturity }) => {
  const buttonRef = useRef<HTMLInputElement>(null);

  const isBorrow = useMemo(() => operationName === 'borrow', [operationName]);

  const onClick = useCallback(() => {
    const config = {
      name: `[Exactly] ${capitalize(operationName)} maturity date reminder`,
      description: 'https://app.exact.ly/dashboard',
      startDate: parseTimestamp(maturity, 'YYYY-MM-DD'),
      startTime: '00:00',
      endTime: '00:00',
      options: ['Google', 'Apple', 'iCal', 'Microsoft365', 'MicrosoftTeams', 'Outlook.com', 'Yahoo'],
      timeZone: 'UTC',
    };

    if (buttonRef.current) atcb_action(config as Parameters<typeof atcb_action>[0], buttonRef.current);
  }, [maturity, operationName]);

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
    >
      <Typography fontSize={16} fontWeight={700}>
        {isBorrow ? 'Remember to pay before the maturity date' : 'Remember to withdraw your assets'}
      </Typography>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center">
        <Typography fontSize={14} fontWeight={500} color="figma.grey.600">
          {isBorrow ? 'You are borrowing from a fixed-rate pool.' : 'You are depositing to a fixed-rate pool.'}
        </Typography>
        {isBorrow && (
          <Typography fontSize={14} fontWeight={500} color="figma.grey.600">
            Avoid penalties by paying your debt before the maturity date.
          </Typography>
        )}
      </Box>
      <Box mt={1}>
        <div ref={buttonRef}>
          <Button variant="contained" onClick={onClick}>
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <CalendarTodayIcon sx={{ fontSize: '16px' }} />
              <Typography fontSize={14} fontWeight={700}>
                Add reminder to your calendar
              </Typography>
            </Box>
          </Button>
        </div>
      </Box>
    </Box>
  );
};

export default Reminder;
