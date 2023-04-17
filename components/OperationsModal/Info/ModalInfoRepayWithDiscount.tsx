import React, { FC } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Image from 'next/image';

import ModalInfo, { Variant } from 'components/common/modal/ModalInfo';
import formatSymbol from 'utils/formatSymbol';
import { InfoOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

type Props = {
  label: string;
  symbol: string;
  isLoading?: boolean;
  amountWithDiscount?: string;
  principal?: string;
  feeAtMaturity?: string;
  discount?: string;
  variant?: Variant;
};

function ModalInfoRepayWithDiscount({
  label,
  amountWithDiscount,
  isLoading,
  principal,
  feeAtMaturity,
  discount,
  symbol,
  variant = 'row',
}: Props) {
  return (
    <CustomTooltip
      title={<Overview principal={principal} feeAtMaturity={feeAtMaturity} discount={discount} />}
      placement="top-end"
      arrow
    >
      <Box pb={1} sx={{ cursor: 'pointer' }}>
        <ModalInfo
          variant={variant}
          label={
            <Box display="flex" gap={0.5}>
              {label}
              <InfoOutlined sx={{ fontSize: '12px', my: 'auto', color: 'grey.500' }} />
            </Box>
          }
        >
          {isLoading ? (
            <Skeleton width={100} />
          ) : (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="modalCol">{amountWithDiscount}</Typography>
              <Image
                src={`/img/assets/${symbol}.svg`}
                alt={formatSymbol(symbol)}
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Box>
          )}
        </ModalInfo>
      </Box>
    </CustomTooltip>
  );
}

const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: '350px',
  },
});

const Overview: FC<Pick<Props, 'principal' | 'feeAtMaturity' | 'discount'>> = ({
  principal,
  feeAtMaturity,
  discount,
}) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Box display="flex" flexDirection="column" gap={0.5}>
        <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
          {t('Debt')}
        </Typography>
        <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
          {t('Fee')}
        </Typography>
        <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
          {t('Discount for early repayment')}
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="end" gap={0.5}>
        <Typography fontWeight={700} fontSize={12}>
          {principal}
        </Typography>
        <Typography fontWeight={700} fontSize={12}>
          {feeAtMaturity}
        </Typography>
        <Typography fontWeight={700} fontSize={12} color="green">
          {discount}
        </Typography>
      </Box>
    </Box>
  );
};

export default React.memo(ModalInfoRepayWithDiscount);
