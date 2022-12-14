import React, { type FC, useContext, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import formatSymbol from 'utils/formatSymbol';
import ItemInfo, { ItemInfoProps } from 'components/common/ItemInfo';
import AccountDataContext from 'contexts/AccountDataContext';
import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import formatNumber from 'utils/formatNumber';
import { Tooltip } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };
import useAccountData from 'hooks/useAccountData';

type Props = {
  symbol: string;
  eMarketAddress?: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol, eMarketAddress }) => {
  const { accountData } = useContext(AccountDataContext);

  const { asset: assetAddress } = useAccountData(symbol);

  const { chain } = useWeb3();

  const { floatingDeposits, floatingBorrows } = useMemo(() => {
    if (!accountData || !symbol) return {};

    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      usdPrice: exchangeRate,
    } = accountData[symbol];

    const totalFloatingDepositUSD = totalDeposited.mul(exchangeRate).div(WeiPerEther);
    const totalFloatingBorrowUSD = totalBorrowed.mul(exchangeRate).div(WeiPerEther);

    return { floatingDeposits: totalFloatingDepositUSD, floatingBorrows: totalFloatingBorrowUSD };
  }, [accountData, symbol]);

  const { fixedDeposits, fixedBorrows } = useMemo(() => {
    if (!accountData) return {};

    const { fixedPools, usdPrice: exchangeRate } = accountData[symbol];
    let tempTotalFixedDeposited = Zero;
    let tempTotalFixedBorrowed = Zero;

    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalFixedDeposited = tempTotalFixedDeposited.add(deposited);
      tempTotalFixedBorrowed = tempTotalFixedBorrowed.add(borrowed);
    });

    const totalDepositedUSD = tempTotalFixedDeposited.mul(exchangeRate).div(WeiPerEther);
    const totalBorrowedUSD = tempTotalFixedBorrowed.mul(exchangeRate).div(WeiPerEther);

    return { fixedDeposits: totalDepositedUSD, fixedBorrows: totalBorrowedUSD };
  }, [accountData, symbol]);

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

  const etherscan = networkData[String(chain?.id) as keyof typeof networkData]?.etherscan;
  return (
    <Grid sx={{ bgcolor: 'white' }} width="100%" p="24px" boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)">
      <Grid item container mb={2.5}>
        <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={29} height={29} />
        <Typography variant="h2" ml={1}>
          {formatSymbol(symbol)}
          {etherscan && (
            <Tooltip title="View Market Contract">
              <IconButton
                size="small"
                href={`${etherscan}/address/${eMarketAddress ?? assetAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon sx={{ alignSelf: 'center', height: '1rem', width: '1rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
      </Grid>
      <Grid item container spacing={4}>
        {itemsInfo.map(({ label, value, underLabel, tooltipTitle }) => (
          <ItemInfo
            key={label.trim()}
            label={label}
            value={value}
            underLabel={underLabel}
            tooltipTitle={tooltipTitle}
          />
        ))}
      </Grid>
    </Grid>
  );
};

export default AssetHeaderInfo;
