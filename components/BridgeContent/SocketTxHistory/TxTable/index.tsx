import React, { memo } from 'react';

import { Table, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TxRow from './TxRow';
import { Chain, TxData } from 'types/Bridge';
import TableSkeleton from './TableSkeleton';

type Props = { txsData?: TxData[]; chains?: Chain[] };

const TxTable = ({ txsData, chains }: Props) => {
  const { t } = useTranslation();
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('From')}</TableCell>
            <TableCell>{t('To')}</TableCell>
            <TableCell>{t('Via')}</TableCell>
            <TableCell>{t('Status')}</TableCell>
          </TableRow>
        </TableHead>
        {txsData ? (
          txsData.map((tx) => <TxRow key={tx.route.activeRouteId} {...tx} chains={chains} />)
        ) : (
          <TableSkeleton />
        )}
      </Table>
    </TableContainer>
  );
};

export default memo(TxTable);
