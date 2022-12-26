import React, { useContext } from 'react';
import { Box, Typography } from '@mui/material';

import { MarketContext } from 'contexts/MarketContext';

import DropdownMenu from 'components/DropdownMenu';
import parseTimestamp from 'utils/parseTimestamp';
import ModalInfo from 'components/common/modal/ModalInfo';

type DateOptionProps = {
  label: string;
  option?: boolean;
};

function DateOption({ label, option = false }: DateOptionProps) {
  return (
    <Typography fontWeight={600} fontSize={option ? 16 : 20} mt={option ? '4px' : '6px'}>
      {label}
    </Typography>
  );
}

function DateSelector() {
  const { date, dates, setDate } = useContext(MarketContext);

  return (
    <ModalInfo label="Fixed rate pool">
      <Box sx={{ ml: -1, mt: -1 }}>
        <DropdownMenu
          label="Maturity"
          options={dates}
          onChange={setDate}
          renderValue={date ? <DateOption label={parseTimestamp(date)} /> : null}
          renderOption={(o: string) => <DateOption option label={parseTimestamp(o)} />}
        />
      </Box>
    </ModalInfo>
  );
}

export default React.memo(DateSelector);
