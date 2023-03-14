import React, { type FC, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Image from 'next/image';
import Typography from '@mui/material/Typography';
import formatSymbol from 'utils/formatSymbol';
import ItemInfo, { ItemInfoProps } from 'components/common/ItemInfo';
import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import formatNumber from 'utils/formatNumber';
import { useWeb3 } from 'hooks/useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };
import useAccountData from 'hooks/useAccountData';
import ExplorerMenu from './ExplorerMenu';
import { Box } from '@mui/material';

type Props = {
  symbol: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol }) => {
  const { marketAccount } = useAccountData(symbol);

  const { chain } = useWeb3();

  const { floatingDeposits, floatingBorrows } = useMemo(() => {
    if (!marketAccount) return {};

    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      usdPrice: exchangeRate,
    } = marketAccount;

    const totalFloatingDepositUSD = totalDeposited.mul(exchangeRate).div(WeiPerEther);
    const totalFloatingBorrowUSD = totalBorrowed.mul(exchangeRate).div(WeiPerEther);

    return { floatingDeposits: totalFloatingDepositUSD, floatingBorrows: totalFloatingBorrowUSD };
  }, [marketAccount]);

  const { fixedDeposits, fixedBorrows } = useMemo(() => {
    if (!marketAccount) return {};

    const { fixedPools, usdPrice: exchangeRate } = marketAccount;
    let tempTotalFixedDeposited = Zero;
    let tempTotalFixedBorrowed = Zero;

    fixedPools.map(({ borrowed, supplied: deposited }) => {
      tempTotalFixedDeposited = tempTotalFixedDeposited.add(deposited);
      tempTotalFixedBorrowed = tempTotalFixedBorrowed.add(borrowed);
    });

    const totalDepositedUSD = tempTotalFixedDeposited.mul(exchangeRate).div(WeiPerEther);
    const totalBorrowedUSD = tempTotalFixedBorrowed.mul(exchangeRate).div(WeiPerEther);

    return { fixedDeposits: totalDepositedUSD, fixedBorrows: totalBorrowedUSD };
  }, [marketAccount]);

  const itemsInfo: ItemInfoProps[] = useMemo((): ItemInfoProps[] => {
    const { decimals, usdPrice } = marketAccount ?? {};
    return [
      {
        label: 'Total Deposits',
        value:
          floatingDeposits !== undefined && fixedDeposits !== undefined && decimals
            ? `$${formatNumber(formatFixed(floatingDeposits.add(fixedDeposits), decimals))}`
            : undefined,
      },
      {
        label: 'Total Borrows',
        value:
          floatingBorrows !== undefined && fixedBorrows !== undefined && decimals
            ? `$${formatNumber(formatFixed(floatingBorrows.add(fixedBorrows), decimals))}`
            : undefined,
      },
      {
        label: 'Total Available',
        value:
          floatingBorrows !== undefined &&
          fixedBorrows !== undefined &&
          floatingDeposits !== undefined &&
          fixedDeposits !== undefined &&
          decimals
            ? `$${formatNumber(
                formatFixed(floatingDeposits.add(fixedDeposits).sub(floatingBorrows.add(fixedBorrows)), decimals),
              )}`
            : undefined,
      },
      {
        label: 'Oracle Price',
        value: usdPrice ? `$${formatNumber(formatFixed(usdPrice, 18), '', true)}` : undefined,
        tooltipTitle: 'The price displayed here is obtained from Chainlink.',
      },
    ];
  }, [marketAccount, floatingDeposits, fixedDeposits, floatingBorrows, fixedBorrows]);

  const etherscan = networkData[String(chain?.id) as keyof typeof networkData]?.etherscan;
  return (
    <Grid sx={{ bgcolor: 'white' }} width="100%" p="24px" boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)">
      <Grid item container mb="24px">
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={symbol}
          width={30}
          height={30}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography variant="h1" ml={1}>
          {formatSymbol(symbol)}
        </Typography>
        {etherscan && marketAccount && (
          <Box mt="12px">
            <ExplorerMenu
              symbol={symbol}
              assetAddress={marketAccount.asset}
              eMarketAddress={marketAccount.market}
              rateModelAddress={marketAccount.interestRateModel.id}
              exaToken={marketAccount.symbol}
            />
          </Box>
        )}
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
