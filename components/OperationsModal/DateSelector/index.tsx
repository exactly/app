import React from 'react';
import { Box, Typography } from '@mui/material';

import DropdownMenu from 'components/DropdownMenu';
import parseTimestamp from 'utils/parseTimestamp';
import ModalInfo from 'components/common/modal/ModalInfo';
import { useTranslation } from 'react-i18next';
import { useMarketContext } from 'contexts/MarketContext';
import { useOperationContext } from 'contexts/OperationContext';

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
  const { date, dates, setDate } = useMarketContext();
  const { setQty } = useOperationContext();

  return (
    <ModalInfo label={t('Fixed rate pool')}>
      <Box sx={{ mt: -1 }}>
        <DropdownMenu
          label={t('Maturity')}
          options={dates}
          onChange={(maturity: number) => {
            setQty('');
            setDate(maturity);
          }}
          renderValue={date ? <DateOption label={parseTimestamp(date)} /> : null}
          renderOption={(o: number) => <DateOption option label={parseTimestamp(o)} />}
        />
      </Box>
    </ModalInfo>
  );
}

export default React.memo(DateSelector);
