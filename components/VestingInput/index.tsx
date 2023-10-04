import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { splitSignature } from '@ethersproject/bytes';
import { type Hex, formatEther, parseEther } from 'viem';
import { waitForTransaction } from '@wagmi/core';
import { escrowedExaABI } from 'types/abi';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction, ExtractAbiFunctionNames } from 'abitype';

import { ModalBox } from 'components/common/modal/ModalBox';

import ModalInput from 'components/OperationsModal/ModalInput';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSignTypedData, useSwitchNetwork } from 'wagmi';
import { useTranslation, Trans } from 'react-i18next';
import { LoadingButton } from '@mui/lab';
import Image from 'next/image';
import { useEXA, useEXABalance, useEXAPrice } from 'hooks/useEXA';
import { useEscrowedEXA, useEscrowedEXABalance, useEscrowedEXAReserveRatio } from 'hooks/useEscrowedEXA';
import formatNumber from 'utils/formatNumber';
import { WEI_PER_ETHER } from 'utils/const';
import { toPercentage } from 'utils/utils';
import Link from 'next/link';
import useIsContract from 'hooks/useIsContract';
import { gasLimit } from 'utils/gas';

type Params<T extends ExtractAbiFunctionNames<typeof escrowedExaABI>> = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof escrowedExaABI, T>['inputs']
>;

function VestingInput() {
  const { t } = useTranslation();

  const { chain } = useNetwork();
  const exa = useEXA();
  const escrowedEXA = useEscrowedEXA();
  const { data: balance, isLoading: balanceIsLoading } = useEscrowedEXABalance();
  const { data: exaBalance } = useEXABalance();
  const { data: reserveRatio } = useEscrowedEXAReserveRatio();
  const EXAPrice = useEXAPrice();
  const { impersonateActive, chain: displayNetwork, isConnected, opts, walletAddress } = useWeb3();
  const { isLoading: switchIsLoading, switchNetwork } = useSwitchNetwork();
  const isContract = useIsContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [isLoading, setIsLoading] = useState(false);

  const [qty, setQty] = useState<string>('');

  const errorData = false;

  const usdValue = useMemo(() => {
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

  const sign = useCallback(async () => {
    if (!walletAddress || reserveRatio === undefined || !exa || !escrowedEXA) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const _qty = parseEther(qty);
    const value = (_qty * reserveRatio) / WEI_PER_ETHER;

    const nonce = await exa.read.nonces([walletAddress], opts);
    const name = await exa.read.name(opts);

    const { v, r, s } = await signTypedDataAsync({
      primaryType: 'Permit',
      domain: {
        name,
        version: '1',
        chainId: displayNetwork.id,
        verifyingContract: exa.address,
      },
      types: {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      message: {
        owner: walletAddress,
        spender: escrowedEXA.address,
        value,
        nonce,
        deadline,
      },
    }).then(splitSignature);

    return {
      value,
      deadline,
      ...{ v, r: r as Hex, s: s as Hex },
    } as const;
  }, [displayNetwork.id, escrowedEXA, exa, opts, qty, reserveRatio, signTypedDataAsync, walletAddress]);

  const submit = useCallback(async () => {
    if (!walletAddress || reserve === undefined || !escrowedEXA || !opts || !qty) return;

    setIsLoading(true);
    try {
      const amount = parseEther(qty);

      let args: Params<'vest'> = [amount, walletAddress] as const;

      if (await isContract(walletAddress)) {
        // TODO
        return;
      }

      const p = await sign();
      if (!p) return;
      args = [...args, p] as const;
      const gas = await escrowedEXA.estimateGas.vest(args, opts);
      const hash = await escrowedEXA.write.vest(args, { ...opts, gasLimit: gasLimit(gas) });

      await waitForTransaction({ hash });
    } catch (e) {
      // TODO
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, reserve, escrowedEXA, qty, isContract, sign, opts]);

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
                data-testid="vesting-input"
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
                  <Skeleton variant="text" width={80} />
                ) : (
                  <Typography color="figma.grey.500" fontSize={12} fontWeight={500} data-testid="vesting-balance">
                    {t('Available')}: {formatNumber(formatEther(balance || 0n))} esEXA
                  </Typography>
                )
              ) : null}
              <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
                ~${formatNumber(usdValue || '0', 'USD')}
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
              <Typography color="#d92626" fontSize={14} fontWeight={500} data-testid="vesting-error">
                <Trans
                  i18nKey="Not enough EXA for reserve. <1>Get EXA</1>."
                  components={{
                    1: <Link href="/get-exa" style={{ fontWeight: 700, textDecoration: 'underline' }} />,
                  }}
                />
              </Typography>
            ) : (
              <>
                <Typography color="#b4babf" fontSize={14} fontWeight={500} data-testid="vesting-reserve-ratio">
                  {t('{{number}} Reserve', { number: toPercentage(Number(reserveRatio) / 1e18, 0) })}
                </Typography>
                <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                  <Image src={`/img/assets/EXA.svg`} alt="" width={16} height={16} />
                  <Typography fontWeight={700} fontSize={14} color="grey.900">
                    EXA
                  </Typography>
                  <Typography fontWeight={500} fontSize={14} color="grey.900" data-testid="vesting-reserve">
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
        ) : displayNetwork.id !== chain?.id ? (
          <LoadingButton
            fullWidth
            variant="contained"
            loading={switchIsLoading}
            onClick={() => switchNetwork?.(displayNetwork.id)}
          >
            {t('Please switch to {{network}} network', { network: displayNetwork.name })}
          </LoadingButton>
        ) : (
          <LoadingButton
            fullWidth
            variant="contained"
            loading={isLoading}
            onClick={submit}
            data-testid="vesting-submit"
          >
            {t('Vest esEXA')}
          </LoadingButton>
        )}
      </Box>
    </Box>
  );
}
export default React.memo(VestingInput);
