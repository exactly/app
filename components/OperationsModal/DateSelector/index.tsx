import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';

import DropdownMenu from 'components/DropdownMenu';
import parseTimestamp from 'utils/parseTimestamp';
import ModalInfo from 'components/common/modal/ModalInfo';
import { useTranslation } from 'react-i18next';
import { useOperationContext } from 'contexts/OperationContext';
import getHourUTC2Local from 'utils/getHourUTC2Local';
import { track } from 'utils/mixpanel';

type DateOptionProps = {
  label: string;
  option?: boolean;
};

function DateOption({ label, option = false }: DateOptionProps) {
  return (
    <Typography
      fontWeight={600}
      fontSize={option ? 14 : 18}
      mt={option ? '4px' : '6px'}
      data-testid={!option ? 'modal-date-selector' : undefined}
    >
      {label}
    </Typography>
  );
}

function DateSelector() {
  const { t } = useTranslation();
  const { setQty, date, dates, setDate } = useOperationContext();

  const handleChange = useCallback(
    (maturity: bigint) => {
      setQty('');
      setDate(maturity);
      track('Option Selected', {
        location: 'Operations Modal',
        name: 'maturity',
        value: String(maturity),
        prevValue: String(date),
      });
    },
    [date, setDate, setQty],
  );
  return (
    <ModalInfo label={t('Fixed rate pool')} underLabel={t('Due at {{hour}}', { hour: getHourUTC2Local() })}>
      <Box sx={{ mt: -1 }}>
        <DropdownMenu
          label={t('Maturity')}
          options={dates}
          onChange={handleChange}
          renderValue={date ? <DateOption label={parseTimestamp(date)} /> : null}
          renderOption={(o: bigint) => <DateOption option label={parseTimestamp(o)} />}
        />
      </Box>
    </ModalInfo>
  );
}

export default React.memo(DateSelector);
