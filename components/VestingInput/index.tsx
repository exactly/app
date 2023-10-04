import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';

import { ModalBox } from 'components/common/modal/ModalBox';

import ModalInput from 'components/OperationsModal/ModalInput';
import { useWeb3 } from 'hooks/useWeb3';
import { useSwitchNetwork } from 'wagmi';
import { useTranslation, Trans } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import Image from 'next/image';
import { useEXABalance, useEXAPrice } from 'hooks/useEXA';
import { useEscrowedEXABalance, useEscrowedEXAReserveRatio } from 'hooks/useEscrowedEXA';
import { formatEther, parseEther } from 'viem';
import formatNumber from 'utils/formatNumber';
import { WEI_PER_ETHER } from 'utils/const';
import { toPercentage } from 'utils/utils';
import Link from 'next/link';

function VestingInput() {
  const { t } = useTranslation();

  const { data: balance, isLoading: balanceIsLoading } = useEscrowedEXABalance();
  const { data: exaBalance } = useEXABalance();
  const { data: reserveRatio } = useEscrowedEXAReserveRatio();
  const EXAPrice = useEXAPrice();
  const { impersonateActive, chain: displayNetwork, isConnected } = useWeb3();
  const { isLoading: switchIsLoading } = useSwitchNetwork();

  const [qty, setQty] = useState<string>('');

  const errorData = false;

  const value = useMemo(() => {
    if (!qty || !EXAPrice) return;

    const parsedqty = parseEther(qty);
    const usd = (parsedqty * EXAPrice) / WEI_PER_ETHER;

    return formatEther(usd);
  }, [EXAPrice, qty]);

  const [reserve, moreThanBalance] = useMemo(() => {
    if (reserveRatio === undefined || exaBalance === undefined || !qty) return [undefined, false];
    const parsed = parseEther(qty);
    const _reserve = (parsed * reserveRatio) / WEI_PER_ETHER;
    return [formatEther(_reserve), _reserve > exaBalance];
  }, [reserveRatio, qty, exaBalance]);

  const submit = useCallback(() => {
    if (reserveRatio === undefined) return;
  }, [reserveRatio]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box>
        <ModalBox
          sx={{
            display: 'flex',
            flexDirection: 'row',
            p: 1,
            px: 2,
            alignItems: 'center',
            zIndex: 420,
            position: 'relative',
            backgroundColor: 'components.bg',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                <Image src={`/img/assets/EXA.svg`} alt="" width={24} height={24} />
                <Typography fontWeight={700} fontSize={19} color="grey.900">
                  esEXA
                </Typography>
              </Box>
              <ModalInput
                decimals={18}
                value={qty}
                onValueChange={setQty}
                align="right"
                maxWidth="100%"
                sx={{ paddingTop: 0, fontSize: 21 }}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: isConnected ? 'space-between' : 'right',
                alignItems: 'center',
                marginTop: 0.25,
                height: 20,
              }}
            >
              {isConnected ? (
                balanceIsLoading ? (
                  <Skeleton variant="text" width={20} />
                ) : (
                  <Typography color="figma.grey.500" fontSize={12} fontWeight={500} data-testid="modal-amount-info">
                    {t('Available')}: {formatNumber(formatEther(balance || 0n))} esEXA
                  </Typography>
                )
              ) : null}
              <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
                ~${formatNumber(value || '0', 'USD')}
              </Typography>
            </Box>
          </Box>
        </ModalBox>
        {reserve ? (
          <Box
            sx={{
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
              backgroundColor: moreThanBalance ? '#fff5f5' : 'grey.100',
              px: 2,
              pt: 2,
              pb: 1,
              mt: -1,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {moreThanBalance ? (
              <Typography color="#d92626" fontSize={14} fontWeight={500}>
                <Trans
                  i18nKey="Not enough EXA for reserve. <1>Get EXA</1>."
                  components={{
                    1: <Link href="/get-exa" style={{ fontWeight: 700, textDecoration: 'underline' }} />,
                  }}
                />
              </Typography>
            ) : (
              <>
                <Typography color="#b4babf" fontSize={14} fontWeight={500}>
                  {t('{{number}} Reserve', { number: toPercentage(Number(reserveRatio) / 1e18, 0) })}
                </Typography>
                <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                  <Image src={`/img/assets/EXA.svg`} alt="" width={16} height={16} />
                  <Typography fontWeight={700} fontSize={14} color="grey.900">
                    EXA
                  </Typography>
                  <Typography fontWeight={500} fontSize={14} color="grey.900">
                    {formatNumber(reserve)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        ) : null}
      </Box>

      <Box mt={errorData ? 0 : 2} display="flex" flexDirection="column" gap={1}>
        {impersonateActive ? (
          <Button fullWidth variant="contained">
            {t('Exit Read-Only Mode')}
          </Button>
        ) : (
          <LoadingButton fullWidth variant="contained" loading={switchIsLoading}>
            {t('Please switch to {{network}} network', { network: displayNetwork.name })}
          </LoadingButton>
        )}
      </Box>
    </Box>
  );
}
export default React.memo(VestingInput);
