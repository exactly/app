import React, { type FC, useMemo, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import ItemInfo, { ItemInfoProps } from 'components/common/ItemInfo';
import formatNumber from 'utils/formatNumber';
import useAccountData from 'hooks/useAccountData';
import ExplorerMenu from './ExplorerMenu';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';
import AssetOption from './AssetOption';
import useRouter from 'hooks/useRouter';
import { WEI_PER_ETHER } from 'utils/const';
import { formatUnits } from 'viem';

type Props = {
  symbol: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const options = useAssets();
  const { push, query } = useRouter();

  const { floatingDeposits, floatingBorrows } = useMemo(() => {
    if (!marketAccount) return {};

    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      usdPrice: exchangeRate,
    } = marketAccount;

    const totalFloatingDepositUSD = (totalDeposited * exchangeRate) / WEI_PER_ETHER;
    const totalFloatingBorrowUSD = (totalBorrowed * exchangeRate) / WEI_PER_ETHER;

    return { floatingDeposits: totalFloatingDepositUSD, floatingBorrows: totalFloatingBorrowUSD };
  }, [marketAccount]);

  const { fixedDeposits, fixedBorrows } = useMemo(() => {
    if (!marketAccount) return {};

    const { fixedPools, usdPrice: exchangeRate } = marketAccount;

    let tempTotalFixedDeposited = 0n;
    let tempTotalFixedBorrowed = 0n;
    fixedPools.forEach(({ borrowed, supplied: deposited }) => {
      tempTotalFixedDeposited = tempTotalFixedDeposited + deposited;
      tempTotalFixedBorrowed = tempTotalFixedBorrowed + borrowed;
    });

    const totalDepositedUSD = (tempTotalFixedDeposited * exchangeRate) / WEI_PER_ETHER;
    const totalBorrowedUSD = (tempTotalFixedBorrowed * exchangeRate) / WEI_PER_ETHER;

    return { fixedDeposits: totalDepositedUSD, fixedBorrows: totalBorrowedUSD };
  }, [marketAccount]);

  const itemsInfo: ItemInfoProps[] = useMemo((): ItemInfoProps[] => {
    const { decimals, usdPrice } = marketAccount ?? {};
    return [
      {
        label: t('Total Deposits'),
        value:
          floatingDeposits !== undefined && fixedDeposits !== undefined && decimals
            ? `$${formatNumber(formatUnits(floatingDeposits + fixedDeposits, decimals))}`
            : undefined,
      },
      {
        label: t('Total Borrows'),
        value:
          floatingBorrows !== undefined && fixedBorrows !== undefined && decimals
            ? `$${formatNumber(formatUnits(floatingBorrows + fixedBorrows, decimals))}`
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
                formatUnits(floatingDeposits + fixedDeposits - (floatingBorrows + fixedBorrows), decimals),
              )}`
            : undefined,
      },
      {
        label: t('Oracle Price'),
        value: usdPrice ? `$${formatNumber(formatUnits(usdPrice, 18), '', true)}` : undefined,
        tooltipTitle: t('The price displayed here is obtained from Chainlink.'),
      },
    ];
  }, [marketAccount, floatingDeposits, fixedDeposits, floatingBorrows, fixedBorrows, t]);

  const onChangeAssetDropdown = useCallback(
    (newSymbol: string) => {
      if (newSymbol === symbol) return;
      push({ pathname: `/${newSymbol}`, query });
    },
    [push, query, symbol],
  );

  return (
    <Grid sx={{ bgcolor: 'components.bg' }} width="100%" p="24px" boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)">
      <Grid item container mb="24px" alignItems="center">
        <DropdownMenu
          label={t('Asset')}
          options={options}
          onChange={onChangeAssetDropdown}
          renderValue={<AssetOption assetSymbol={symbol} optionSize={22} selectedSize={30} />}
          renderOption={(o: string) => <AssetOption option assetSymbol={o} optionSize={22} selectedSize={30} />}
        />
        {marketAccount && (
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
