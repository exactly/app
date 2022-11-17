import type { Contract } from '@ethersproject/contracts';
import React, { useContext, useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AuditorContext from 'contexts/AuditorContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ContractsContext from 'contexts/ContractsContext';

import { SmartPoolItemData } from 'types/SmartPoolItemData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import { useWeb3Context } from 'contexts/Web3Context';
import TableRowSmartPool from './TableRowSmartPool';

type Props = {
  type: 'deposit' | 'borrow';
};

function SmartPoolDashboardTable({ type }: Props) {
  const { walletAddress } = useWeb3Context();
  const auditor = useContext(AuditorContext);
  const { accountData } = useContext(AccountDataContext);
  const { getInstance } = useContext(ContractsContext);

  const [itemData, setItemData] = useState<Array<SmartPoolItemData> | undefined>(undefined);
  const [auditorContract, setAuditorContract] = useState<Contract | undefined>(undefined);

  const orderAssets = ['DAI', 'USDC', 'WETH', 'WBTC', 'wstETH'];

  useEffect(() => {
    getCurrentBalance();
  }, [walletAddress, accountData, type]);

  useEffect(() => {
    getAuditorContract();
  }, [auditor]);

  function getAuditorContract() {
    const auditorContract = getInstance(auditor.address!, auditor.abi!, 'auditor');
    setAuditorContract(auditorContract);
  }

  function getCurrentBalance() {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort((a: FixedLenderAccountData, b: FixedLenderAccountData) => {
      return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
    });

    const data: SmartPoolItemData[] = [];

    allMarkets.forEach((market) => {
      const symbol = market.assetSymbol;
      const depositBalance = market.floatingDepositAssets;
      const eTokens = market.floatingDepositShares;
      const borrowBalance = market.floatingBorrowAssets;
      const address = market.market;

      const obj = {
        symbol: symbol,
        eTokens: eTokens,
        depositedAmount: depositBalance,
        borrowedAmount: borrowBalance,
        market: address,
      };

      data.push(obj);
    });

    setItemData(data);
  }

  const headers: {
    label: string;
    key: string;
    tooltipTitle?: string;
    tooltipPlacement?: 'top' | 'top-start' | 'top-end';
    align?: 'left' | 'inherit' | 'center' | 'right' | 'justify';
  }[] = [
    {
      label: 'Asset',
      key: 'asset',
      tooltipPlacement: 'top-start',
      align: 'left',
    },
    {
      label: 'Value',
      key: 'value',
    },
    ...(type === 'deposit'
      ? [
          {
            label: 'eToken',
            key: 'eToken',
          },
          {
            label: 'Collateral',
            key: 'collateral',
          },
        ]
      : []),
    {
      label: '',
      key: 'deposit',
    },
    {
      label: '',
      key: 'borrow',
    },
  ];

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header.label} align={header.align || 'center'}>
                <Tooltip title={header.tooltipTitle} placement={header.tooltipPlacement || 'top'} arrow>
                  <Typography variant="subtitle2" sx={{ color: 'grey.500' }} fontWeight={600}>
                    {header.label}
                  </Typography>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {itemData?.map((item: SmartPoolItemData, key: number) => (
            <TableRowSmartPool
              key={`row_${key}`}
              depositAmount={item.depositedAmount}
              borrowedAmount={item.borrowedAmount}
              symbol={item.symbol}
              walletAddress={walletAddress}
              eTokenAmount={item.eTokens}
              auditorContract={auditorContract}
              type={{ label: type, value: type }}
              market={item.market}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SmartPoolDashboardTable;
