import React, { memo } from 'react';
import { formatUnits } from 'viem';
import { useTranslation } from 'react-i18next';
import { Skeleton, Typography } from '@mui/material';
import { type Allowance } from 'hooks/useAllowances';
import formatNumber from 'utils/formatNumber';

const Amount = ({
  allowance,
  unlimited,
  decimals,
  symbol,
  allowanceUSD,
}: Pick<Allowance, 'allowance' | 'unlimited' | 'decimals' | 'symbol' | 'allowanceUSD'>) => {
  const { t } = useTranslation();
  if (allowance === undefined) return <Skeleton />;

  if (unlimited)
    return (
      <Typography fontSize={19} fontWeight={500} mb={2}>
        {t('Unlimited')}
      </Typography>
    );

  return (
    <>
      <Typography fontSize={19} fontWeight={500}>
        {formatNumber(formatUnits(allowance, decimals), symbol, true)}
      </Typography>
      <Typography fontFamily="IBM Plex Mono" fontSize={14} fontWeight={500} color="grey.500">
        ${formatNumber(formatUnits(allowanceUSD, decimals), symbol, true)}
      </Typography>
    </>
  );
};

export default memo(Amount);
