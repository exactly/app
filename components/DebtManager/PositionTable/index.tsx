import React, { type PropsWithChildren } from 'react';
import Image from 'next/image';
import { BigNumber } from '@ethersproject/bignumber';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import OperationSquare from 'components/common/OperationSquare';
import parseTimestamp from 'utils/parseTimestamp';

export type PositionTableRow = {
  symbol: string;
  maturity?: number;
  balance?: string;
  apr: BigNumber;
  isBest?: boolean;
};

type Props = {
  data: PositionTableRow[];
  onClick: (row: PositionTableRow) => void;
};

function PositionTable({ data, onClick }: Props) {
  const { t } = useTranslation();
  const showBalance = data.some((row) => row.balance);
  return (
    <TableContainer sx={{ height: '100%' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <HeaderCell>{t('Asset')}</HeaderCell>
            <HeaderCell>{t('Type')}</HeaderCell>
            <HeaderCell>{t('Maturity Date')}</HeaderCell>
            {showBalance && <HeaderCell>{t('Balance')}</HeaderCell>}
            <HeaderCell>{t('APR')}</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              hover
              tabIndex={-1}
              key={row.symbol + row.maturity + row.balance}
              sx={{ cursor: 'pointer' }}
              onClick={() => onClick(row)}
            >
              <TableCell>
                <AssetCell symbol={row.symbol} />
              </TableCell>
              <TableCell>
                <TypeCell maturity={row.maturity} />
              </TableCell>
              <TableCell>
                <TextCell>{row.maturity ? parseTimestamp(row.maturity) : t('Unlimited')}</TextCell>
              </TableCell>
              {showBalance && (
                <TableCell>
                  <TextCell>{row.balance}</TextCell>
                </TableCell>
              )}
              <TableCell>
                <TextCell>0%</TextCell>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function HeaderCell({ children }: PropsWithChildren) {
  return (
    <TableCell sx={{ borderTop: '1px solid #E0E0E0' }}>
      <Typography variant="subtitle2" color="figma.grey.500" fontWeight={500} width="fit-content" fontSize={14}>
        {children}
      </Typography>
    </TableCell>
  );
}

function AssetCell({ symbol }: { symbol: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width="24" height="24" />
      <Typography fontWeight={400} fontSize={14} ml={0.5} color="grey.900">
        {symbol}
      </Typography>
    </Box>
  );
}

function TypeCell({ maturity }: { maturity?: number }) {
  return <OperationSquare type={maturity ? 'fixed' : 'floating'} />;
}

function TextCell({ children }: PropsWithChildren) {
  return (
    <Typography fontWeight={500} fontSize={16} fontFamily="fontFamilyMonospaced" color="grey.900">
      {children}
    </Typography>
  );
}

export default React.memo(PositionTable);
