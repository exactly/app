import React, { type FC, useMemo, useCallback, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import ItemInfo, { ItemInfoProps } from 'components/common/ItemInfo';
import formatNumber from 'utils/formatNumber';
import useAccountData from 'hooks/useAccountData';
import ExplorerMenu from './ExplorerMenu';
import { Trans, useTranslation } from 'react-i18next';
import DropdownMenu from 'components/DropdownMenu';
import useAssets from 'hooks/useAssets';
import AssetOption from './AssetOption';
import useRouter from 'hooks/useRouter';
import { Address, formatEther, formatUnits } from 'viem';
import useStETHNativeAPR from 'hooks/useStETHNativeAPR';
import { toPercentage } from 'utils/utils';
import { track } from 'utils/mixpanel';
import { Box, Typography } from '@mui/material';
import getSymbolDescription from 'utils/getSymbolDescription';
import useContractAddress from 'hooks/useContractAddress';
import { useWeb3 } from 'hooks/useWeb3';
import Alert from '@mui/material/Alert';
import { useFloatingBalances } from 'hooks/useFloatingBalances';
import { useFixedBalances } from 'hooks/useFixedBalances';
import useGlobalUtilization from 'hooks/useGlobalUtilization';
import { mainnet } from 'wagmi';

type Props = {
  symbol: string;
};

const AssetHeaderInfo: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);
  const options = useAssets();
  const { push, query } = useRouter();
  const getContractAddress = useContractAddress();
  const globalUtilization = useGlobalUtilization(symbol);
  const { floatingDeposits, floatingBorrows } = useFloatingBalances(symbol);
  const { fixedDeposits, fixedBorrows } = useFixedBalances(symbol);
  const [priceFeedAddress, setPriceFeedAddress] = useState<Address | undefined>(undefined);
  const {
    chain: { id: displayNetworkId },
  } = useWeb3();

  const nativeAPR = useStETHNativeAPR();

  const assetDescription = useCallback(
    (s: string) => {
      if (!marketAccount) return '';
      return getSymbolDescription(marketAccount, s);
    },
    [marketAccount],
  );

  useEffect(() => {
    const fetchPriceFeedAddress = async () => {
      const address = await getContractAddress(`PriceFeed${symbol}`);
      setPriceFeedAddress(address);
    };

    fetchPriceFeedAddress();
  }, [getContractAddress, symbol]);

  const itemsInfo = useMemo(() => {
    const { decimals, usdPrice } = marketAccount ?? {};

    const items: ItemInfoProps[] = [
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
        label: t('Available'),
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
        tooltipTitle: (
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={12} fontWeight={500}>
              {t('Available for Withdrawal')}
            </Typography>
            <Typography fontSize={12} color="blue" sx={{ textDecoration: 'underline' }}>
              <a
                target="_blank"
                rel="noreferrer noopener"
                href="https://docs.exact.ly/guides/parameters#a.-reserve-factor"
              >
                {t('Learn more about reserve factor.')}
              </a>
            </Typography>
          </Box>
        ),
      },
      {
        label: t('Global Utilization'),
        value: toPercentage(Number(globalUtilization) / 1e18),
      },
      {
        label: t('Oracle Price'),
        value: usdPrice ? `$${formatNumber(formatUnits(usdPrice, 18), '', true)}` : undefined,
        tooltipTitle: t('The price displayed here is obtained from Chainlink.'),
      },
      ...(symbol === 'wstETH'
        ? [
            {
              label: t('Native APR'),
              value: nativeAPR ? toPercentage(Number(formatEther(nativeAPR))) : undefined,
              tooltipTitle: t('The APR displayed comes from the Lido API.'),
            },
          ]
        : []),
    ];

    return items;
  }, [
    marketAccount,
    floatingBorrows,
    floatingDeposits,
    fixedDeposits,
    t,
    fixedBorrows,
    globalUtilization,
    symbol,
    nativeAPR,
  ]);

  const onChangeAssetDropdown = useCallback(
    (newSymbol: string) => {
      track('Option Selected', {
        location: 'Asset Header Info',
        name: 'asset',
        value: newSymbol,
        prevValue: symbol,
      });

      if (newSymbol === symbol) return;
      push({ pathname: `/${newSymbol}`, query });
    },
    [push, query, symbol],
  );

  const borrowableUtilization = useMemo(() => {
    if (!marketAccount) return;

    if (displayNetworkId === mainnet.id) return BigInt(9 * 1e17);
    if ('reserveFactor' in marketAccount) {
      return WAD - marketAccount.reserveFactor;
    }
    return;
  }, [displayNetworkId, marketAccount]);

  return (
    <>
      <Grid
        sx={{ bgcolor: 'components.bg' }}
        width="100%"
        p="24px"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
      >
        <Grid item container mb="24px" alignItems="center">
          <DropdownMenu
            label={t('Asset')}
            options={options}
            onChange={onChangeAssetDropdown}
            renderValue={<AssetOption assetSymbol={symbol} optionSize={22} selectedSize={30} />}
            renderOption={(o: string) => <AssetOption option assetSymbol={o} optionSize={22} selectedSize={30} />}
          />
          {marketAccount && priceFeedAddress && (
            <ExplorerMenu
              symbol={symbol}
              assetAddress={marketAccount.asset}
              eMarketAddress={marketAccount.market}
              rateModelAddress={marketAccount.interestRateModel.id}
              priceFeedAddress={priceFeedAddress}
              exaToken={marketAccount.symbol}
            />
          )}
          <Typography sx={{ width: '100%' }} variant="dashboardMainSubtitle">
            {assetDescription(symbol)}
          </Typography>
        </Grid>
        <Grid item container spacing={4}>
          {itemsInfo.map(({ label, value, underLabel, tooltipTitle, sx }) => (
            <ItemInfo
              key={label.trim()}
              label={label}
              value={value}
              underLabel={underLabel}
              tooltipTitle={tooltipTitle}
              sx={sx}
            />
          ))}
        </Grid>
      </Grid>
      {globalUtilization !== undefined &&
        borrowableUtilization !== undefined &&
        globalUtilization > borrowableUtilization && (
          <Alert sx={{ width: '100%' }} severity="info">
            <Typography variant="body2">
              {t(
                "The Global Utilization is above {{borrowableUtilization}}, and the remaining liquidity is established as a Liquidity Reserve that can't be borrowed and is only available for withdrawals.",
                {
                  borrowableUtilization: toPercentage(Number(borrowableUtilization) / 1e18, 0),
                },
              )}
            </Typography>
            <Typography variant="body2">
              <Trans
                i18nKey="More info here: <1>reserve-factor</1>."
                components={{
                  1: (
                    <a
                      target="_blank"
                      rel="noreferrer noopener"
                      href="https://docs.exact.ly/guides/parameters#a.-reserve-factor"
                      style={{ textDecoration: 'underline' }}
                    ></a>
                  ),
                }}
              />
            </Typography>
          </Alert>
        )}
    </>
  );
};

export default AssetHeaderInfo;
