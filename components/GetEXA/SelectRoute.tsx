import React, { MouseEvent, memo, useCallback } from 'react';

import { ArrowBack, ChevronRight, Edit } from '@mui/icons-material';
import { Box, Typography, Input, Skeleton, Button, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ChainSelector from './ChainSelector';
import Image from 'next/image';
import { Screen, TXStep, useGetEXA } from 'contexts/GetEXAContext';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useWeb3 } from 'hooks/useWeb3';
import RouteStepsWrapper from './RouteSteps';
import Routes from './Routes';
import SocketAssetSelector from 'components/SocketAssetSelector';
import { optimism } from 'wagmi/chains';
import { useEXABalance, useEXAPrice } from 'hooks/useEXA';
import { formatEther, formatUnits } from 'viem';
import formatNumber from 'utils/formatNumber';
import { LoadingButton } from '@mui/lab';
import { track } from 'utils/segment';
import { AssetBalance } from 'types/Bridge';

const SelectRoute = () => {
  const {
    chain,
    route,
    qtyOut,
    qtyIn,
    routes,
    asset,
    txStep,
    socketError,
    qtyOutUSD,
    assets,
    txError,
    setScreen,
    setQtyIn,
    setRoute,
    setAsset,
    submit,
  } = useGetEXA();
  const { t } = useTranslation();
  const { chain: walletChain } = useNetwork();
  const { connect, walletAddress } = useWeb3();
  const isConnected = !!walletChain;
  const exaPrice = useEXAPrice();
  const nativeSwap = asset?.symbol === 'ETH' && chain?.chainId === optimism.id;
  const { data: exaBalance } = useEXABalance({ watch: true });
  const insufficientBalance = Boolean(asset && qtyIn && Number(qtyIn) > asset.amount);
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const handleSubmit = useCallback(
    ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
      track('Button Clicked', {
        location: 'Get EXA',
        name: 'submit',
        text: currentTarget.innerText,
        symbol: asset?.symbol,
      });

      if (nativeSwap) return submit();
      setScreen(Screen.REVIEW_ROUTE);
    },
    [asset, nativeSwap, setScreen, submit],
  );

  const handleAssetChange = useCallback(
    (a: AssetBalance) => {
      setAsset(a);
      track('Option Selected', {
        location: 'Get EXA',
        name: 'asset',
        value: a.symbol,
        prevValue: asset?.symbol,
      });
    },
    [asset, setAsset],
  );

  const handleBalanceClick = useCallback(() => {
    setQtyIn(String(asset?.amount));
    track('Button Clicked', {
      location: 'Get EXA',
      name: 'from balance',
      value: asset && formatNumber(asset.amount, asset.symbol),
    });
  }, [asset, setQtyIn]);

  const handleAmountBlur = useCallback(
    () => track('Input Unfocused', { location: 'Get EXA', name: 'amount in', value: qtyIn }),
    [qtyIn],
  );
  const handleSwitchNetworkClick = useCallback(() => {
    switchNetwork?.(chain?.chainId);
    track('Button Clicked', {
      location: 'Get EXA',
      name: 'switch network',
      value: chain?.name,
    });
  }, [chain?.chainId, chain?.name, switchNetwork]);
  const handleConnectWallet = useCallback(() => {
    connect();
    track('Button Clicked', {
      location: 'Get EXA',
      name: 'connect wallet',
    });
  }, [connect]);

  const handleEditClick = useCallback(() => {
    track('Option Selected', {
      name: 'edit route',
      value: !route,
      prevValue: !!route,
      location: 'Get EXA',
    });

    if (route) setRoute(null);
    if (routes) setRoute(routes[0]);
  }, [route, routes, setRoute]);
  return (
    <>
      <Box display={'flex'} gap={2} flexDirection="column" data-testid="get-exa-view-route">
        <Box p={[2, 2, 3]} flexDirection="column" bgcolor="grey.100" borderRadius={1}>
          <Typography color="grey.400" fontWeight={500} fontSize={14} pb={1}>
            {t('Pay with')}:
          </Typography>
          <Box display="flex" flexWrap="wrap" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1} fontSize="14px">
              <Typography fontSize={14} fontWeight={500}>
                {t('Network')}:
              </Typography>
              <ChainSelector />
            </Box>
            {chain && (
              <Box display="flex" alignItems="center" gap={1} fontSize="14px">
                <Typography fontSize={14} fontWeight={500}>
                  {t('Asset')}:
                </Typography>
                {assets && asset ? (
                  <SocketAssetSelector
                    asset={asset}
                    onChange={handleAssetChange}
                    options={assets}
                    onClick={walletAddress ? undefined : connect}
                  />
                ) : (
                  <Skeleton width={200} />
                )}
              </Box>
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Input
              sx={{ fontSize: '32px' }}
              type="number"
              disableUnderline
              placeholder="0.0"
              value={qtyIn || ''}
              onChange={({ target: { value } }) => setQtyIn(value)}
              inputProps={{
                'data-testid': 'get-exa-input',
              }}
              onBlur={handleAmountBlur}
            />
            {asset ? (
              <Typography
                ml="auto"
                color="grey.400"
                fontWeight={400}
                whiteSpace="nowrap"
                onClick={handleBalanceClick}
                sx={{
                  '&:hover': {
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  },
                }}
                data-testid="get-exa-balance"
              >
                {t('Balance')}: {formatNumber(asset.amount, asset.symbol)}
              </Typography>
            ) : (
              <Skeleton width={200} />
            )}
          </Box>
        </Box>
        <Box display="flex" justifyContent="center" mt={-3.5} mb={-3.5}>
          <Box
            borderRadius="100%"
            width={32}
            height={32}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="text.primary"
            sx={{
              transform: 'rotate(90deg)',
            }}
          >
            <ChevronRight width={24} height={24} sx={{ color: 'components.bg', margin: 'auto' }} />
          </Box>
        </Box>
        <Box p={3} pb={1} flexDirection="column" bgcolor="grey.100" borderRadius={1}>
          <Box display="flex">
            {qtyOutUSD !== undefined ? (
              <Typography color="grey.400" fontWeight={500} fontSize={14}>
                {t('Receive')}: ${formatNumber(formatEther(qtyOutUSD))}
              </Typography>
            ) : (
              <Skeleton width={200} />
            )}

            <Box display="flex" gap={0.5} ml="auto" fontWeight={600} alignItems="center">
              <Image src="/img/assets/EXA.svg" alt="EXA" width="16" height="16" />
              EXA
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {!nativeSwap && route === undefined && qtyIn ? (
              <Skeleton width={200} height={55} />
            ) : (
              <Input
                sx={{ fontSize: '32px' }}
                type="number"
                disableUnderline
                placeholder="0.0"
                value={qtyOut ? formatEther(qtyOut) : '-'}
              />
            )}
            {exaBalance !== undefined ? (
              <Typography ml="auto" color="grey.400" fontWeight={400} whiteSpace="nowrap">
                {t('Balance')}: {formatNumber(formatUnits(exaBalance, 18))}
              </Typography>
            ) : (
              <Skeleton width={200} />
            )}
          </Box>
        </Box>
        <Typography fontSize={14} color="grey.400">
          {exaPrice ? <> 1 EXA = ${formatNumber(formatEther(exaPrice))}</> : null}
        </Typography>
      </Box>
      {!nativeSwap && !!qtyIn && (
        <Box display="flex" flexDirection="column">
          <Box mb={1} display="flex" justifyContent={'space-between'} alignItems="center">
            <Typography fontWeight={700} fontSize={19} mb={3}>
              {t('Route')}
            </Typography>
            {routes && routes.length > 1 && (
              <Button variant="text" onClick={handleEditClick}>
                {route ? <Edit fontSize={'small'} /> : <ArrowBack fontSize={'small'} />}
              </Button>
            )}
          </Box>
          {socketError?.status ? (
            <Alert severity="error">{socketError.message}</Alert>
          ) : routes?.length === 0 ? (
            <Alert severity="info">{t('No routes where found')}</Alert>
          ) : route === null ? (
            <Routes />
          ) : route === undefined ? (
            <Skeleton width={'100%'} height={24} variant="rectangular" sx={{ borderRadius: 1 }} />
          ) : (
            <RouteStepsWrapper />
          )}
        </Box>
      )}
      {txError?.status && <Alert severity="error">{txError.message}</Alert>}

      {isConnected ? (
        walletChain?.id !== chain?.chainId ? (
          <LoadingButton fullWidth onClick={handleSwitchNetworkClick} variant="contained" loading={switchIsLoading}>
            {t('Please switch to {{network}} network', { network: chain?.name })}
          </LoadingButton>
        ) : (
          <LoadingButton
            disabled={(!route && !nativeSwap) || insufficientBalance}
            variant="contained"
            onClick={handleSubmit}
            loading={txStep === TXStep.CONFIRM_PENDING}
            data-testid={nativeSwap ? 'get-exa-submit' : 'get-exa-review'}
          >
            {insufficientBalance
              ? t('Insufficient {{symbol}} balance', { symbol: asset?.symbol })
              : `${t('Get')} ${qtyOut ? `${formatNumber(formatUnits(qtyOut, 18))} ` : ''}EXA`}
          </LoadingButton>
        )
      ) : (
        <Button fullWidth onClick={handleConnectWallet} variant="contained">
          {t('Connect wallet')}
        </Button>
      )}
    </>
  );
};

export default memo(SelectRoute);
