import React, { useCallback, useMemo } from 'react';
import DropdownMenu from 'components/DropdownMenu';
import formatNumber from 'utils/formatNumber';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { formatUnits } from 'viem';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type OptionProps = {
  installments: number;
  repayAmount: bigint;
  option?: boolean;
};

export function Option({ installments, repayAmount, option = false }: OptionProps) {
  const { symbol } = useOperationContext();
  const { marketAccount } = useAccountData(symbol);

  return (
    <Typography
      fontWeight={600}
      fontSize={option ? 14 : 18}
      mt={option ? '4px' : '6px'}
      data-testid={!option ? 'modal-date-selector' : undefined}
      sx={{
        '& span': {
          color: 'grey.600',
        },
      }}
    >
      {installments} x{' '}
      <span>
        {repayAmount === 0n ? '' : '~'}
        {marketAccount ? formatNumber(formatUnits(repayAmount, marketAccount.decimals)) : <Skeleton />}
      </span>
    </Typography>
  );
}

export default function InstallmentsOptions() {
  const { t } = useTranslation();
  const { installments, onInstallmentsChange, installmentsOptions, symbol } = useOperationContext();
  const { marketAccount } = useAccountData(symbol);

  const handleChange = useCallback(
    (option: { installments: number }) => {
      onInstallmentsChange(option.installments);
    },
    [onInstallmentsChange],
  );

  const option = useMemo(() => {
    if (!installmentsOptions) return;
    return installmentsOptions.find((o) => Number(o.installments) === installments);
  }, [installments, installmentsOptions]);

  if (!installmentsOptions || !option) return <Skeleton />;

  return (
    <Box display="flex" flexDirection="column" alignItems="end">
      <DropdownMenu
        label={t('Maturity')}
        options={installmentsOptions}
        onChange={handleChange}
        renderValue={option ? <Option {...option} /> : null}
        renderOption={(o: OptionProps) => <Option option {...o} />}
      />
      {option ? (
        <Typography
          color="figma.grey.500"
          fontWeight={500}
          fontSize={13}
          fontFamily="fontFamilyMonospaced"
          textAlign="right"
          marginRight="28.4px"
        >
          {t('Total')}{' '}
          {option && marketAccount ? (
            formatNumber(formatUnits(option.repayAmount * BigInt(option.installments), marketAccount.decimals))
          ) : (
            <Skeleton />
          )}
        </Typography>
      ) : null}
    </Box>
  );
}
