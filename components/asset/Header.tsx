import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import formatSymbol from 'utils/formatSymbol';
import { getAddressEtherscanUrl, Network } from 'utils/network';
import ItemInfo, { ItemInfoProps } from 'components/common/ItemInfo';
import AccountDataContext from 'contexts/AccountDataContext';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import formatNumber from 'utils/formatNumber';
import { useRouter } from 'next/router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Tooltip } from '@mui/material';

type Props = {
  symbol: string;
  networkName: string;
  assetAddress: string;
  eMarketAddress?: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol, networkName, assetAddress, eMarketAddress }) => {
  const { accountData } = useContext(AccountDataContext);

  const etherscanUrl = getAddressEtherscanUrl(networkName as Network, eMarketAddress ?? assetAddress);
  const [floatingDeposits, setFloatingDeposits] = useState<BigNumber | undefined>(undefined);
  const [floatingBorrows, setFloatingBorrows] = useState<BigNumber | undefined>(undefined);
  const [fixedDeposits, setFixedDeposits] = useState<BigNumber | undefined>(undefined);
  const [fixedBorrows, setFixedBorrows] = useState<BigNumber | undefined>(undefined);
  const router = useRouter();

  const fetchFloatingPoolData = useCallback(async () => {
    if (!accountData || !symbol) return;

    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      usdPrice: exchangeRate,
    } = accountData[symbol];

    const totalFloatingDepositUSD = totalDeposited.mul(exchangeRate).div(WeiPerEther);
    const totalFloatingBorrowUSD = totalBorrowed.mul(exchangeRate).div(WeiPerEther);

    setFloatingDeposits(totalFloatingDepositUSD);
    setFloatingBorrows(totalFloatingBorrowUSD);
  }, [accountData, symbol]);

  const getMaturitiesData = useCallback(async () => {
    if (!accountData) return;

    const { fixedPools, usdPrice: exchangeRate } = accountData[symbol];
    let tempTotalFixedDeposited = Zero;
    let tempTotalFixedBorrowed = Zero;

    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalFixedDeposited = tempTotalFixedDeposited.add(deposited);
      tempTotalFixedBorrowed = tempTotalFixedBorrowed.add(borrowed);
    });

    const totalDepositedUSD = tempTotalFixedDeposited.mul(exchangeRate).div(WeiPerEther);
    const totalBorrowedUSD = tempTotalFixedBorrowed.mul(exchangeRate).div(WeiPerEther);

    setFixedDeposits(totalDepositedUSD);
    setFixedBorrows(totalBorrowedUSD);
  }, [accountData, symbol]);

  useEffect(() => {
    fetchFloatingPoolData();
    getMaturitiesData();
  }, [fetchFloatingPoolData, getMaturitiesData]);

  const itemsInfo: ItemInfoProps[] = useMemo((): ItemInfoProps[] => {
    if (!accountData) return [];
    const { decimals } = accountData[symbol];
    return [
      {
        label: 'Total Deposits',
        value:
          floatingDeposits != null && fixedDeposits != null
            ? `$${formatNumber(formatFixed(floatingDeposits.add(fixedDeposits), decimals))}`
            : undefined,
      },
      {
        label: 'Total Borrows',
        value:
          floatingBorrows != null && fixedBorrows != null
            ? `$${formatNumber(formatFixed(floatingBorrows.add(fixedBorrows), decimals))}`
            : undefined,
      },
      {
        label: 'Total Available',
        value:
          floatingBorrows != null && fixedBorrows != null && floatingDeposits != null && fixedDeposits != null
            ? `$${formatNumber(
                formatFixed(floatingDeposits.add(fixedDeposits).sub(floatingBorrows.add(fixedBorrows)), decimals),
              )}`
            : undefined,
      },
    ];
  }, [fixedBorrows, fixedDeposits, floatingBorrows, floatingDeposits, accountData, symbol]);

  return (
    <Grid>
      <Grid item container mb={1}>
        <IconButton onClick={() => router.back()}>
          <Tooltip title="Go Back" placement="top">
            <ArrowBackIcon fontSize="small" />
          </Tooltip>
        </IconButton>
        <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={29} height={29} />
        <Typography variant="h2" ml={1}>
          {formatSymbol(symbol)}
          <Tooltip title="View Market Contract">
            <IconButton size="small" href={etherscanUrl} target="_blank" rel="noopener noreferrer">
              <OpenInNewIcon sx={{ alignSelf: 'center', height: '1rem', width: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Typography>
      </Grid>
      <Grid item container spacing={4}>
        {itemsInfo.map(({ label, value, underLabel, tooltip }) => (
          <ItemInfo key={label.trim()} label={label} value={value} underLabel={underLabel} tooltip={tooltip} />
        ))}
      </Grid>
    </Grid>
  );
};

export default AssetHeaderInfo;
