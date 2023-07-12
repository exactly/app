import React, { memo } from 'react';

import { Table, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TxRow from './TxRow';
import { TxData } from 'types/Bridge';

type Props = { txsData: TxData[] };

const TxTable = ({ txsData }: Props) => {
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
        {txsData.map((tx) => (
          <TxRow key={tx.route.activeRouteId} {...tx} />
        ))}
      </Table>
    </TableContainer>
  );
};

export default memo(TxTable);
