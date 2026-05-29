import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  PaperProps,
  Skeleton,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import dayjs from 'dayjs';
import { hexToSignature, formatEther, parseEther, zeroAddress, type Hex } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import {
  escrowedExaAddress,
  exaAddress,
  useReadExaAllowance,
  useReadExaBalanceOf,
  useReadExaName,
  useReadExaNonces,
  useReadEscrowedExaBalanceOf,
  useReadEscrowedExaReserveRatio,
  useReadEscrowedExaVestingPeriod,
  useSimulateEscrowedExaVest,
  useSimulateExaApprove,
  useWriteEscrowedExaVest,
  useWriteExaApprove,
} from 'generated/wagmi';
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import { WAD } from '@exactly/lib';

import { ModalBox } from 'components/common/modal/ModalBox';

import ModalInput from 'components/OperationsModal/ModalInput';
import { useConnection, useSignTypedData } from 'wagmi';
import { useTranslation, Trans } from 'react-i18next';
import MainActionButton from 'components/common/MainActionButton';
import Image from 'next/image';
import { useEXAPrice } from 'hooks/useEXA';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import useIsContract from 'hooks/useIsContract';
import { Transaction } from 'types/Transaction';
import LoadingTransaction from 'components/common/modal/Loading';
import { track } from 'utils/mixpanel';
import { useModal } from '../../contexts/ModalContext';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type Permit = { value: bigint; deadline: bigint; v: number; r: Hex; s: Hex };

const escrowedExaChainId = Object.keys(escrowedExaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof escrowedExaAddress => chainId === defaultChain.id);
const exaChainId = Object.keys(exaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof exaAddress => chainId === defaultChain.id);

function PaperComponent(props: PaperProps | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref as unknown as React.RefObject<HTMLElement>} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} ref={ref} />
    </Draggable>
  );
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function LoadingModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const { t } = useTranslation();
  const { breakpoints, spacing, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);

  const handleClose = useCallback(() => {
    if (loadingTx) return;
    onClose();
    track('Modal Closed', {
      name: 'vest',
    });
  }, [loadingTx, onClose]);

  return (
    <Dialog
      data-testid="vesting-vest-modal"
      open={!!tx}
      onClose={handleClose}
      PaperComponent={isMobile ? undefined : PaperComponent}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: '375px',
          maxWidth: '488px !important',
          width: '100%',
          overflowY: 'hidden !important',
        },
      }}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
      disableEscapeKeyDown={loadingTx}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 4,
          top: 8,
          color: 'grey.500',
        }}
        data-testid="vesting-vest-modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          borderTop: tx ? '' : `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
          overflowY: 'auto',
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <LoadingTransaction
            tx={tx}
            messages={{
              pending: t('You are vesting your esEXA'),
              success: t('Your esEXA has been vested'),
              error: t('Something went wrong'),
            }}
          />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

type Props = {
  refetch: () => void;
};

function VestingInput({ refetch }: Props) {
  const { t } = useTranslation();
  const { account: walletAddress, isImpersonating: impersonateActive } = useReadOnly();

  const { data: balance, isLoading: balanceIsLoading } = useReadEscrowedExaBalanceOf({
    chainId: escrowedExaChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: escrowedExaChainId !== undefined, staleTime: 30_000 },
  });
  const { data: exaBalance } = useReadExaBalanceOf({
    chainId: exaChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: exaChainId !== undefined, staleTime: 30_000 },
  });
  const { data: reserveRatio } = useReadEscrowedExaReserveRatio({
    chainId: escrowedExaChainId,
    query: { enabled: escrowedExaChainId !== undefined, staleTime: 30_000 },
  });
  const { data: vestingPeriod } = useReadEscrowedExaVestingPeriod({
    chainId: escrowedExaChainId,
    query: { enabled: escrowedExaChainId !== undefined, staleTime: 30_000 },
  });
  const EXAPrice = useEXAPrice();
  const { isConnected } = useConnection();
  const exa = exaChainId === undefined ? undefined : exaAddress[exaChainId];
  const escrowedEXA = escrowedExaChainId === undefined ? undefined : escrowedExaAddress[escrowedExaChainId];
  const isContract = useIsContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [isLoading, setIsLoading] = useState(false);
  const [tx, setTx] = useState<Transaction>();
  const [permit, setPermit] = useState<Permit>();
  const [submitPermitVest, setSubmitPermitVest] = useState(false);
  const { open: openGetEXA } = useModal('get-exa');

  const [qty, setQty] = useState<string>('');
  const amount = useMemo(() => (qty ? parseEther(qty) : 0n), [qty]);

  const usdValue = useMemo(() => {
    if (!qty || !EXAPrice) return;

    const usd = (amount * EXAPrice) / WAD;

    return formatEther(usd);
  }, [EXAPrice, amount, qty]);

  const [reserve, moreThanBalance, exaRemaining] = useMemo(() => {
    if (reserveRatio === undefined || exaBalance === undefined || !qty) return [undefined, false];
    const _reserve = (amount * reserveRatio) / WAD;
    const _exaRemaining = _reserve - exaBalance;

    return [formatEther(_reserve), _reserve > exaBalance, _exaRemaining];
  }, [reserveRatio, amount, qty, exaBalance]);

  const reserveAmount = useMemo(
    () => (reserveRatio === undefined ? 0n : (amount * reserveRatio) / WAD + 1n),
    [amount, reserveRatio],
  );
  const exaAllowance = useReadExaAllowance({
    chainId: exaChainId,
    args: walletAddress && escrowedEXA ? [walletAddress, escrowedEXA] : undefined,
    query: { enabled: Boolean(walletAddress && escrowedEXA && exaChainId !== undefined) },
  });
  const { data: nonce } = useReadExaNonces({
    chainId: exaChainId,
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(walletAddress && exaChainId !== undefined) },
  });
  const { data: name } = useReadExaName({
    chainId: exaChainId,
    query: { enabled: exaChainId !== undefined },
  });
  const approveSimulation = useSimulateExaApprove({
    account: walletAddress,
    chainId: exaChainId,
    args: escrowedEXA ? [escrowedEXA, reserveAmount] : undefined,
    query: { enabled: Boolean(walletAddress && escrowedEXA && exaChainId !== undefined && reserveAmount > 1n) },
  });
  const vestArgs = useMemo(
    () =>
      walletAddress && reserveRatio !== undefined && vestingPeriod !== undefined
        ? ([amount, walletAddress, reserveRatio, BigInt(vestingPeriod)] as const)
        : undefined,
    [amount, reserveRatio, vestingPeriod, walletAddress],
  );
  const permitVestArgs = useMemo(
    () => (vestArgs && permit ? ([vestArgs[0], vestArgs[1], vestArgs[2], vestArgs[3], permit] as const) : undefined),
    [permit, vestArgs],
  );
  const vestSimulation = useSimulateEscrowedExaVest({
    account: walletAddress,
    chainId: escrowedExaChainId,
    args: vestArgs,
    query: {
      enabled: Boolean(
        walletAddress &&
          escrowedExaChainId !== undefined &&
          reserveRatio !== undefined &&
          vestingPeriod !== undefined &&
          amount > 0n,
      ),
    },
  });
  const permitVestSimulation = useSimulateEscrowedExaVest({
    account: walletAddress,
    chainId: escrowedExaChainId,
    args: permitVestArgs,
    query: {
      enabled: Boolean(
        walletAddress &&
          escrowedExaChainId !== undefined &&
          reserveRatio !== undefined &&
          vestingPeriod !== undefined &&
          permit &&
          amount > 0n &&
          submitPermitVest,
      ),
    },
  });
  const { writeContractAsync: approveExa } = useWriteExaApprove();
  const { writeContractAsync: vest } = useWriteEscrowedExaVest();

  const insufficientFunds = useMemo(() => {
    return amount > (balance || 0n) || !qty || moreThanBalance;
  }, [amount, balance, moreThanBalance, qty]);

  const sign = useCallback(async () => {
    if (!walletAddress || reserveRatio === undefined || !exa || !escrowedEXA || nonce === undefined || !name) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const value = (amount * reserveRatio) / WAD + 1n;

    const { v, r, s } = await signTypedDataAsync({
      primaryType: 'Permit',
      domain: {
        name,
        version: '1',
        chainId: defaultChain.id,
        verifyingContract: exa,
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
        spender: escrowedEXA,
        value,
        nonce,
        deadline,
      },
    }).then(hexToSignature);

    return {
      value,
      deadline,
      ...{ v: Number(v), r, s },
    } as const;
  }, [amount, escrowedEXA, exa, name, nonce, reserveRatio, signTypedDataAsync, walletAddress]);

  const submit = useCallback(async () => {
    if (!walletAddress || reserveRatio === undefined || vestingPeriod === undefined || !escrowedEXA || !exa || !qty) {
      return;
    }

    setIsLoading(true);
    let permitPending = false;

    let hash;
    try {
      if (await isContract(walletAddress)) {
        const allowance = (await exaAllowance.refetch()).data;

        if ((allowance ?? 0n) < reserveAmount) {
          const approveRequest = approveSimulation.data ?? (await approveSimulation.refetch()).data;
          if (!approveRequest) return;
          const approveHash = await approveExa(approveRequest.request);
          await waitForTransaction({ hash: approveHash });
        }

        const vestRequest = vestSimulation.data ?? (await vestSimulation.refetch()).data;
        if (!vestRequest || !vestArgs) return;
        hash = await vest({ chainId: escrowedExaChainId, args: vestArgs });
      } else {
        const p = await sign();
        if (!p) return;
        permitPending = true;
        setPermit(p);
        setSubmitPermitVest(true);
        return;
      }

      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });

      setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
    } catch (e) {
      if (hash) setTx({ status: 'error', hash });
    } finally {
      if (!permitPending) setIsLoading(false);
    }
  }, [
    walletAddress,
    reserveRatio,
    vestingPeriod,
    escrowedEXA,
    exa,
    qty,
    isContract,
    exaAllowance,
    reserveAmount,
    approveSimulation,
    approveExa,
    vestSimulation,
    vestArgs,
    vest,
    sign,
  ]);

  useEffect(() => {
    if (!submitPermitVest || !permitVestSimulation.data) return;
    setSubmitPermitVest(false);
    void (async () => {
      let hash;
      try {
        if (!permitVestArgs) return;
        hash = await vest({ chainId: escrowedExaChainId, args: permitVestArgs });
        setTx({ status: 'processing', hash });
        const { status, transactionHash } = await waitForTransaction({ hash });
        setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
      } catch {
        if (hash) setTx({ status: 'error', hash });
      } finally {
        setPermit(undefined);
        setIsLoading(false);
      }
    })();
  }, [permitVestArgs, permitVestSimulation.data, submitPermitVest, vest, walletAddress]);

  useEffect(() => {
    if (!submitPermitVest || !permitVestSimulation.error) return;
    setSubmitPermitVest(false);
    setPermit(undefined);
    setIsLoading(false);
  }, [permitVestSimulation.error, submitPermitVest]);

  const handleMaxClick = useCallback(() => {
    if (balance) {
      setQty(formatEther(balance));
    }
    track('Button Clicked', {
      location: 'Vesting',
      name: 'max',
      value: formatNumber(formatEther(balance || 0n)),
    });
  }, [balance]);

  const onClose = useCallback(() => {
    setTx(undefined);
    setQty('');
    refetch();
  }, [refetch]);

  const handleBlur = useCallback(() => {
    track('Input Unfocused', {
      name: 'vesting',
      location: 'Vesting',
      value: qty,
    });
  }, [qty]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {tx && <LoadingModal tx={tx} onClose={onClose} />}
      <Box>
        <ModalBox
          sx={{
            display: 'flex',
            flexDirection: 'row',
            p: 1,
            px: 2,
            alignItems: 'center',
            zIndex: 69,
            position: 'relative',
            backgroundColor: 'components.bg',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                <Image src={`/img/assets/esEXA.svg`} alt="" width={24} height={24} />
                <Typography fontWeight={700} fontSize={19} color="grey.900" mr={1}>
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
                onBlur={handleBlur}
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
                  <Box display="flex">
                    <Typography
                      color="figma.grey.500"
                      fontSize={12}
                      fontWeight={700}
                      alignSelf="center"
                      data-testid="vesting-balance"
                    >
                      {t('Available')}: {formatNumber(formatEther(balance || 0n))}
                    </Typography>
                    <Button
                      onClick={handleMaxClick}
                      sx={{
                        textTransform: 'uppercase',
                        borderRadius: 1,
                        p: 0.5,
                        minWidth: 'fit-content',
                        height: 'fit-content',
                        color: 'figma.grey.500',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      Max
                    </Button>
                  </Box>
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
                  i18nKey={`You need ${formatNumber(formatEther(exaRemaining))} more EXA for reserve. <1>Get EXA</1>.`}
                  components={{
                    1: (
                      <button
                        onClick={() => {
                          openGetEXA();
                          track('Button Clicked', {
                            location: 'Vesting',
                            name: 'get EXA',
                          });
                        }}
                        style={{
                          fontWeight: 700,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 'unset',
                          background: 'unset',
                          border: 'unset',
                          fontSize: 'unset',
                          color: 'unset',
                        }}
                      />
                    ),
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

      <Box mt={0} display="flex" flexDirection="column" gap={1}>
        {impersonateActive ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() =>
              track('Button Clicked', {
                location: 'Vesting',
                name: 'exit read-only mode',
              })
            }
          >
            {t('Exit Read-Only Mode')}
          </Button>
        ) : (
          <MainActionButton
            fullWidth
            variant="contained"
            loading={isLoading}
            onClick={() => {
              submit();
              track('Button Clicked', {
                location: 'Vesting',
                name: 'vest',
                value: qty,
                text: insufficientFunds ? t('Insufficient esEXA balance') : t('Vest esEXA'),
              });
            }}
            data-testid="vesting-submit"
            disabled={insufficientFunds}
          >
            {insufficientFunds && amount > 0n ? t('Insufficient esEXA balance') : t('Vest esEXA')}
          </MainActionButton>
        )}
      </Box>
    </Box>
  );
}
export default React.memo(VestingInput);
