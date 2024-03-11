import React, { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import parseTimestamp from 'utils/parseTimestamp';
import { useOperationContext } from 'contexts/OperationContext';
import ModalAlert from 'components/common/modal/ModalAlert';
import DropdownMenu from 'components/DropdownMenu';
import getHourUTC2Local from 'utils/getHourUTC2Local';
import { track } from 'utils/mixpanel';
import { DAY } from 'utils/utils';

type DateOptionProps = {
  label: string;
  option?: boolean;
};

export function DateOption({ label, option = false }: DateOptionProps) {
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

function BorrowDateSelector() {
  const { t } = useTranslation();
  const { date, dates, setDate } = useOperationContext();
  const daysToMaturity = useMemo(() => {
    if (!date) return;
    const now = BigInt(Math.round(Date.now() / 1000));
    return Number((date - now) / DAY);
  }, [date]);

  const handleChange = useCallback(
    (maturity: bigint) => {
      setDate(maturity);
      track('Option Selected', {
        location: 'Operations Modal',
        name: 'maturity',
        value: String(maturity),
        prevValue: String(date),
      });
    },
    [date, setDate],
  );

  return (
    <Box display="flex" flexDirection="column" flexGrow={1} gap="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography fontFamily="fontFamilyMonospaced" color="grey.600" fontSize={12} fontWeight={500} noWrap>
          {t('First Payment Due Date')}
        </Typography>
        <Box>
          <DropdownMenu
            label={t('Maturity')}
            options={dates}
            onChange={handleChange}
            renderValue={date ? <DateOption label={parseTimestamp(date)} /> : null}
            renderOption={(o: bigint) => <DateOption option label={parseTimestamp(o)} />}
          />
          <Typography
            color="figma.grey.500"
            fontWeight={500}
            fontSize={13}
            fontFamily="fontFamilyMonospaced"
            textAlign="right"
            marginRight="28.4px"
          >
            {t('at {{hour}}', { hour: getHourUTC2Local(undefined, 'h a [UTC] Z') })}
          </Typography>
        </Box>
      </Box>
      {daysToMaturity && daysToMaturity <= 7 && (
        <ModalAlert
          message={`${
            daysToMaturity === 1 ? t('Dues in 1 day.') : t('Dues in {{daysToMaturity}} days.', { daysToMaturity })
          } ${t('For optimal benefits, consider selecting a pool with a longer remaining duration.')}`}
          variant="warning"
        />
      )}
    </Box>
  );
}

export default React.memo(BorrowDateSelector);
