import React, { memo, useCallback } from 'react';

import { Box, Typography, Table, TableBody, TableRow, TableCell, Avatar, useTheme, Skeleton } from '@mui/material';
import { optimism } from 'wagmi/chains';
import { TXStep, useGetEXA } from 'contexts/GetEXAContext';
import { LoadingButton } from '@mui/lab';
import { useTranslation } from 'react-i18next';

import formatNumber from 'utils/formatNumber';
import Image from 'next/image';
import { formatEther } from 'viem';
import ModalAlert from 'components/common/modal/ModalAlert';
import { ArrowForward } from '@mui/icons-material';
import { Protocol, Route } from '../../types/Bridge';
import { track } from 'utils/mixpanel';

export const RouteTable = ({
  route,
  protocol,
  qtyOut,
  qtyOutUSD,
}: {
  route?: Route | null;
  protocol?: Protocol;
  qtyOut?: bigint;
  qtyOutUSD?: bigint;
}) => {
  const { palette } = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        backgroundColor: 'grey.50',
        border: '1px solid',
        borderColor: palette.grey[200],
        borderRadius: 1,
        p: 2,
        '& td:first-of-type': {
          color: palette.text.disabled,
        },
        '& td:last-of-type': {
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'row-reverse',
        },
        '& td': {
          p: 1,
        },
        '& tr:first-of-type td': {
          paddingTop: 0,
        },
        '& tr:last-of-type td': {
          border: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>{t('Estimated Output')}</TableCell>
            <TableCell>
              <Box display="flex" flexDirection="column">
                <Box display="flex" gap={0.5}>
                  <Image width={20} height={20} src="/img/assets/EXA.svg" alt="EXA" />
                  {qtyOut !== undefined && (
                    <Typography fontSize={19} fontWeight={700}>
                      EXA {formatNumber(formatEther(qtyOut))}
                    </Typography>
                  )}
                </Box>
                <Typography fontSize={14} fontWeight={500} fontFamily={'IBM Plex Mono'} color="grey.500">
                  {qtyOutUSD !== undefined && <Typography>~${formatNumber(formatEther(qtyOutUSD))}</Typography>}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Dex')}</TableCell>
            <TableCell>
              {protocol && (
                <Box display="flex" gap={1} alignItems="center">
                  <Avatar src={protocol.icon || ''} alt={protocol.displayName} sx={{ width: 20, height: 20 }} />
                  <Typography fontSize={19} fontWeight={700}>
                    {protocol.displayName}
                  </Typography>
                </Box>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Gas Fee')}</TableCell>
            <TableCell>
              {route ? (
                route.totalGasFeesInUsd && (
                  <Typography fontSize={19} fontWeight={700}>
                    ${formatNumber(route.totalGasFeesInUsd)}
                  </Typography>
                )
              ) : (
                <Skeleton width={100} />
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Swap Slippage')}</TableCell>
            <TableCell>
              <Typography fontSize={19} fontWeight={700}>
                {route ? (
                  `${route.userTxs[0].swapSlippage || route.userTxs[0].steps?.[0]?.bridgeSlippage}%`
                ) : (
                  <Skeleton width={100} />
                )}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};

const ReviewRoute = () => {
  const { t } = useTranslation();
  const { chain, asset, route, qtyOut, qtyOutUSD, qtyIn, txStep, protocol, txError, approve, socketSubmit } =
    useGetEXA();
  const handleConfirmClick = useCallback(() => {
    socketSubmit();
    track('Button Clicked', {
      location: 'Get EXA',
      name: 'confirm',
    });
  }, [socketSubmit]);

  const handleApproveClick = useCallback(() => {
    approve();
    track('Button Clicked', {
      location: 'Get EXA',
      name: 'approve',
    });
  }, [approve]);

  if (!asset?.logoURI || !chain || !qtyOut || !protocol) {
    return;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3} data-testid="get-exa-view-review">
      <Typography fontSize={19} fontWeight={700}>
        {t('Transaction Summary')}
      </Typography>
      <Table
        sx={{
          '& td': {
            border: 0,
            padding: 0,
          },
        }}
      >
        <TableBody>
          <TableRow>
            <TableCell sx={{ position: 'relative' }}>
              <Typography fontSize={14} mb={1}>
                {t('From')}
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Image width={24} height={24} src={asset.logoURI || ''} alt={asset.symbol} />
                  <Typography fontSize={19} fontWeight={500}>
                    {formatNumber(qtyIn)} {asset.symbol}
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Image width={16} height={16} style={{ borderRadius: '100%' }} src={chain.icon} alt={chain.name} />
                  <Typography fontSize={14} fontWeight={700}>
                    {chain.chainId === optimism.id ? optimism.name : chain.name}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <ArrowForward fontSize={'small'} sx={{ color: 'blue', marginX: 2 }} width={24} />
            </TableCell>
            <TableCell>
              <Typography fontSize={14} mb={1}>
                {t('To')}
              </Typography>
              <Box display="flex" gap={0.5} flexDirection={'column'}>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Image width={24} height={24} src="/img/assets/EXA.svg" alt="EXA" />
                  <Typography fontSize={19} fontWeight={500}>
                    {formatNumber(formatEther(qtyOut))} EXA
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Image
                    width={16}
                    height={16}
                    style={{ borderRadius: '100%' }}
                    src={'/img/assets/OP.svg'}
                    alt={optimism.name}
                  />
                  <Typography fontSize={14} fontWeight={700}>
                    {optimism.name}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <RouteTable route={route} protocol={protocol} qtyOut={qtyOut} qtyOutUSD={qtyOutUSD} />

      {txError?.status && <ModalAlert message={txError.message} variant={txError.variant} mb={1} />}
      {txStep === TXStep.CONFIRM || txStep === TXStep.CONFIRM_PENDING ? (
        <LoadingButton
          variant="contained"
          onClick={handleConfirmClick}
          loading={txStep === TXStep.CONFIRM_PENDING}
          data-testid="get-exa-submit"
        >
          {t('Confirm')}
        </LoadingButton>
      ) : (
        <LoadingButton
          fullWidth
          onClick={handleApproveClick}
          variant="contained"
          loading={txStep === TXStep.APPROVE_PENDING}
          data-testid="get-exa-approve"
        >
          {t('Approve')}
        </LoadingButton>
      )}
    </Box>
  );
};

export default memo(ReviewRoute);
