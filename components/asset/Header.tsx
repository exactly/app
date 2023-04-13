import React, { type FC, useMemo, useCallback } from 'react';
import Router from 'next/router';
import Grid from '@mui/material/Grid';
import ItemInfo, { ItemInfoProps } from 'components/common/ItemInfo';
import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import formatNumber from 'utils/formatNumber';
import { useWeb3 } from 'hooks/useWeb3';
import networkData from 'config/networkData.json' assert { type: 'json' };
import useAccountData from 'hooks/useAccountData';
import ExplorerMenu from './ExplorerMenu';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';
import AssetOption from './AssetOption';

type Props = {
  symbol: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const options = useAssets();
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
        label: t('Total Deposits'),
        value:
          floatingDeposits !== undefined && fixedDeposits !== undefined && decimals
            ? `$${formatNumber(formatFixed(floatingDeposits.add(fixedDeposits), decimals))}`
            : undefined,
      },
      {
        label: t('Total Borrows'),
        value:
          floatingBorrows !== undefined && fixedBorrows !== undefined && decimals
            ? `$${formatNumber(formatFixed(floatingBorrows.add(fixedBorrows), decimals))}`
            : undefined,
      },
      {
        label: t('Total Available'),
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
        label: t('Oracle Price'),
        value: usdPrice ? `$${formatNumber(formatFixed(usdPrice, 18), '', true)}` : undefined,
        tooltipTitle: t('The price displayed here is obtained from Chainlink.'),
      },
    ];
  }, [marketAccount, floatingDeposits, fixedDeposits, floatingBorrows, fixedBorrows, t]);

  const onChangeAssetDropdown = useCallback((newSymbol: string) => {
    Router.push({ pathname: '/[symbol]', query: { ...Router.query, symbol: newSymbol } });
  }, []);

  const etherscan = networkData[String(chain?.id) as keyof typeof networkData]?.etherscan;
  return (
    <Grid sx={{ bgcolor: 'components.bg' }} width="100%" p="24px" boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)">
      <Grid item container mb="24px" justifyContent="space-between" alignItems="end">
        <DropdownMenu
          label={t('Asset')}
          options={options}
          onChange={onChangeAssetDropdown}
          renderValue={<AssetOption assetSymbol={symbol} optionSize={22} selectedSize={30} />}
          renderOption={(o: string) => <AssetOption option assetSymbol={o} optionSize={22} selectedSize={30} />}
        />
        {etherscan && marketAccount && (
          <ExplorerMenu
            symbol={symbol}
            assetAddress={marketAccount.asset}
            eMarketAddress={marketAccount.market}
            rateModelAddress={marketAccount.interestRateModel.id}
            exaToken={marketAccount.symbol}
          />
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
