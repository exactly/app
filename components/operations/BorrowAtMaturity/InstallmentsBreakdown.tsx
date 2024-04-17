import React from 'react';
import { Box, Button, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useOperationContext } from 'contexts/OperationContext';
import TableHeadCell from 'components/common/TableHeadCell';
import parseTimestamp from 'utils/parseTimestamp';
import useAccountData from 'hooks/useAccountData';
import { formatUnits } from 'viem';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';

export default function InstallmentsBreakdown({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { installmentsDetails, symbol } = useOperationContext();
  const { marketAccount } = useAccountData(symbol);
  if (!installmentsDetails || !marketAccount) return <Skeleton />;

  return (
    <Box display="flex" flexDirection="column" flex={1}>
      <Box
        sx={{
          border: '1px solid #E3E5E8',
          px: 2,
          borderRadius: 1,
          maxHeight: 392,
          overflowY: 'scroll',
          '& tr:last-child td': {
            border: 'none',
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell title={''} />
              <TableHeadCell title={t('Maturity')} />
              <TableHeadCell title={t('Repay Amount')} />
            </TableRow>
          </TableHead>
          <TableBody>
            {installmentsDetails.installmentsRepayAmount.map((option, index) => (
              <TableRow key={option.toString()}>
                <TableCell>
                  <Typography fontSize={19} fontWeight={500} color="grey.500">
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={'bold'}>{parseTimestamp(installmentsDetails.maturities[index])}</Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Image
                      src={`/img/assets/${symbol}.svg`}
                      alt={symbol}
                      width={24}
                      height={24}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                    <Typography fontWeight={'bold'}>
                      {formatNumber(
                        formatUnits(installmentsDetails.installmentsRepayAmount[index], marketAccount.decimals),
                      )}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Button onClick={onClose} variant="contained" sx={{ marginTop: 'auto' }}>
        {t('Back')}
      </Button>
    </Box>
  );
}
