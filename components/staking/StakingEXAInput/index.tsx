import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  AvatarGroup,
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
import { hexToSignature, formatEther, parseEther, zeroAddress, type Hex } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import {
  exaAddress,
  stakedExaAddress,
  useReadExaAllowance,
  useReadExaBalanceOf,
  useReadExaName,
  useReadExaNonces,
  useReadStakedExaBalanceOf,
  useSimulateExaApprove,
  useSimulateStakedExaDeposit,
  useSimulateStakedExaPermitAndDeposit,
  useSimulateStakedExaWithdraw,
  useWriteExaApprove,
  useWriteStakedExaDeposit,
  useWriteStakedExaPermitAndDeposit,
  useWriteStakedExaWithdraw,
} from 'generated/wagmi';
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import { WAD } from '@exactly/lib';

import { ModalBox } from 'components/common/modal/ModalBox';

import ModalInput from 'components/OperationsModal/ModalInput';
import { useTranslation } from 'react-i18next';
import MainActionButton from 'components/common/MainActionButton';
import Image from 'next/image';
import { useEXAPrice } from 'hooks/useEXA';
import formatNumber from 'utils/formatNumber';
import { Transaction } from 'types/Transaction';
import LoadingTransaction from 'components/common/modal/Loading';
import { track } from 'utils/mixpanel';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import dayjs from 'dayjs';
import { useConnection, useSignTypedData } from 'wagmi';
import useIsContract from 'hooks/useIsContract';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type Permit = { value: bigint; deadline: bigint; v: number; r: Hex; s: Hex };

const exaChainId = Object.keys(exaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof exaAddress => chainId === defaultChain.id);
const stakedExaChainId = Object.keys(stakedExaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof stakedExaAddress => chainId === defaultChain.id);

function PaperComponent(props: PaperProps | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref} cancel={'[class*="MuiDialogContent-root"]'}>
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
      name: `Staking`,
    });
  }, [loadingTx, onClose]);

  return (
    <Dialog
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
        data-testid="staking-modal-close"
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
              pending: t('pending'),
              success: t('success'),
              error: t('error'),
            }}
          />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

type Props = {
  refetch: () => void;
  operation: 'deposit' | 'withdraw';
};

function StakingEXAInput({ refetch, operation }: Props) {
  const { t } = useTranslation();
  const { account: walletAddress } = useReadOnly();

  const { data: balance, isLoading: balanceIsLoading } = useReadStakedExaBalanceOf({
    chainId: stakedExaChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: stakedExaChainId !== undefined, staleTime: 30_000 },
  });
  const { data: exaBalance, isLoading: exaBalanceIsLoading } = useReadExaBalanceOf({
    chainId: exaChainId,
    args: [walletAddress ?? zeroAddress],
    query: { enabled: exaChainId !== undefined, staleTime: 30_000 },
  });
  const { rewardsTokens } = useStakeEXA();
  const EXAPrice = useEXAPrice();
  const { isConnected } = useConnection();
  const exa = exaChainId === undefined ? undefined : exaAddress[exaChainId];
  const stakedEXA = stakedExaChainId === undefined ? undefined : stakedExaAddress[stakedExaChainId];
  const [isLoading, setIsLoading] = useState(false);
  const [tx, setTx] = useState<Transaction>();
  const [permit, setPermit] = useState<Permit>();
  const [submitPermitAndDeposit, setSubmitPermitAndDeposit] = useState(false);
  const { signTypedDataAsync } = useSignTypedData();
  const isContract = useIsContract();

  const [qty, setQty] = useState<string>('');
  const amount = useMemo(() => (qty ? parseEther(qty) : 0n), [qty]);
  const theme = useTheme();
  const usdValue = useMemo(() => {
    if (!qty || !EXAPrice) return;

    const usd = (amount * EXAPrice) / WAD;

    return formatEther(usd);
  }, [EXAPrice, amount, qty]);

  const exaAllowance = useReadExaAllowance({
    chainId: exaChainId,
    args: walletAddress && stakedEXA ? [walletAddress, stakedEXA] : undefined,
    query: { enabled: Boolean(walletAddress && stakedEXA && exaChainId !== undefined && operation === 'deposit') },
  });
  const { data: nonce } = useReadExaNonces({
    chainId: exaChainId,
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(walletAddress && exaChainId !== undefined && operation === 'deposit') },
  });
  const { data: name } = useReadExaName({
    chainId: exaChainId,
    query: { enabled: exaChainId !== undefined && operation === 'deposit' },
  });
  const approveSimulation = useSimulateExaApprove({
    account: walletAddress,
    chainId: exaChainId,
    args: stakedEXA ? [stakedEXA, amount] : undefined,
    query: { enabled: Boolean(walletAddress && stakedEXA && exaChainId !== undefined && amount > 0n) },
  });
  const depositSimulation = useSimulateStakedExaDeposit({
    account: walletAddress,
    chainId: stakedExaChainId,
    args: walletAddress ? [amount, walletAddress] : undefined,
    query: {
      enabled: Boolean(walletAddress && stakedExaChainId !== undefined && amount > 0n && operation === 'deposit'),
    },
  });
  const permitAndDepositSimulation = useSimulateStakedExaPermitAndDeposit({
    account: walletAddress,
    chainId: stakedExaChainId,
    args: walletAddress && permit ? [amount, walletAddress, permit] : undefined,
    query: {
      enabled: Boolean(
        walletAddress && permit && stakedExaChainId !== undefined && amount > 0n && submitPermitAndDeposit,
      ),
    },
  });
  const withdrawSimulation = useSimulateStakedExaWithdraw({
    account: walletAddress,
    chainId: stakedExaChainId,
    args: walletAddress ? [amount, walletAddress, walletAddress] : undefined,
    query: {
      enabled: Boolean(walletAddress && stakedExaChainId !== undefined && amount > 0n && operation === 'withdraw'),
    },
  });
  const { writeContractAsync: approveExa } = useWriteExaApprove();
  const { writeContractAsync: deposit } = useWriteStakedExaDeposit();
  const { writeContractAsync: permitAndDeposit } = useWriteStakedExaPermitAndDeposit();
  const { writeContractAsync: withdraw } = useWriteStakedExaWithdraw();

  const insufficientFunds = useMemo(() => {
    return operation === 'deposit' ? amount > (exaBalance || 0n) || !qty : amount > (balance || 0n) || !qty;
  }, [amount, balance, exaBalance, operation, qty]);

  const sign = useCallback(async () => {
    if (!walletAddress || !exa || !stakedEXA || nonce === undefined || !name) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const value = amount + 1n;

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
        spender: stakedEXA,
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
  }, [amount, exa, name, nonce, signTypedDataAsync, stakedEXA, walletAddress]);

  const submit = useCallback(async () => {
    if (!walletAddress || !stakedEXA || !exa || !qty) return;

    setIsLoading(true);
    let permitPending = false;

    let hash;
    try {
      if (operation === 'deposit') {
        if (await isContract(walletAddress)) {
          const allowance = (await exaAllowance.refetch()).data;

          if ((allowance ?? 0n) < amount) {
            const approveRequest = approveSimulation.data ?? (await approveSimulation.refetch()).data;
            if (!approveRequest) return;
            const approveHash = await approveExa(approveRequest.request);
            await waitForTransaction({ hash: approveHash });
          }

          const depositRequest = depositSimulation.data ?? (await depositSimulation.refetch()).data;
          if (!depositRequest) return;
          hash = await deposit(depositRequest.request);
        } else {
          const p = await sign();
          if (!p) return;
          permitPending = true;
          setPermit(p);
          setSubmitPermitAndDeposit(true);
          return;
        }

        setTx({ status: 'processing', hash });

        const { status, transactionHash } = await waitForTransaction({ hash });

        setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
      } else {
        const withdrawRequest = withdrawSimulation.data ?? (await withdrawSimulation.refetch()).data;
        if (!withdrawRequest) return;
        hash = await withdraw(withdrawRequest.request);
        setTx({ status: 'processing', hash });

        const { status, transactionHash } = await waitForTransaction({ hash });

        setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
      }
    } catch (e) {
      if (hash) setTx({ status: 'error', hash });
    } finally {
      if (!permitPending) {
        refetch();
        setIsLoading(false);
      }
    }
  }, [
    walletAddress,
    stakedEXA,
    exa,
    qty,
    operation,
    isContract,
    amount,
    exaAllowance,
    approveSimulation,
    approveExa,
    depositSimulation,
    deposit,
    sign,
    withdrawSimulation,
    withdraw,
    refetch,
  ]);

  useEffect(() => {
    if (!submitPermitAndDeposit || !permitAndDepositSimulation.data) return;
    setSubmitPermitAndDeposit(false);
    void (async () => {
      let hash;
      try {
        hash = await permitAndDeposit(permitAndDepositSimulation.data.request);
        setTx({ status: 'processing', hash });
        const { status, transactionHash } = await waitForTransaction({ hash });
        setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
      } catch {
        if (hash) setTx({ status: 'error', hash });
      } finally {
        setPermit(undefined);
        refetch();
        setIsLoading(false);
      }
    })();
  }, [permitAndDeposit, permitAndDepositSimulation.data, refetch, submitPermitAndDeposit]);

  useEffect(() => {
    if (!submitPermitAndDeposit || !permitAndDepositSimulation.error) return;
    setSubmitPermitAndDeposit(false);
    setPermit(undefined);
    setIsLoading(false);
  }, [permitAndDepositSimulation.error, submitPermitAndDeposit]);

  const handleMaxClick = useCallback(() => {
    operation === 'deposit' ? setQty(formatEther(exaBalance || 0n)) : setQty(formatEther(balance || 0n));
    track('Button Clicked', {
      location: 'Staking',
      name: `max ${operation}`,
      value: formatNumber(formatEther(exaBalance || 0n)),
    });
  }, [balance, exaBalance, operation]);

  const onClose = useCallback(() => {
    setTx(undefined);
    setQty('');
    refetch();
  }, [refetch]);

  return (
    <Box display="flex" flexDirection="column" gap={9}>
      {tx && <LoadingModal tx={tx} onClose={onClose} />}
      <Box>
        <ModalBox
          sx={{
            display: 'flex',
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
              <ModalInput
                decimals={18}
                value={qty}
                onValueChange={setQty}
                align="left"
                maxWidth="100%"
                sx={{ paddingTop: 0, fontSize: 21 }}
                data-testid="staking-input"
                onBlur={() => {}}
              />
              <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                <Image src={`/img/assets/EXA.svg`} alt="" width={24} height={24} />
                <Typography fontWeight={700} fontSize={24} color="grey.900" mr={1}>
                  EXA
                </Typography>
              </Box>
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
              <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
                ~${formatNumber(usdValue || '0', 'USD')}
              </Typography>
              {isConnected ? (
                balanceIsLoading || exaBalanceIsLoading ? (
                  <Skeleton variant="text" width={80} />
                ) : (
                  <Box display="flex">
                    <Typography
                      color="figma.grey.500"
                      fontSize={14}
                      fontWeight={500}
                      alignSelf="center"
                      data-testid="staking-balance"
                    >
                      {operation === 'deposit'
                        ? `${t('Balance')}: ${formatNumber(formatEther(exaBalance || 0n))}`
                        : `${t('Staked')}: ${formatNumber(formatEther(balance || 0n))}`}
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
                        fontWeight: 500,
                        fontSize: 14,
                      }}
                    >
                      Max
                    </Button>
                  </Box>
                )
              ) : null}
            </Box>
          </Box>
        </ModalBox>
        {operation === 'withdraw' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: `${theme.palette.grey[100]}`,
              padding: '13px 16px 8px 16px',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 'none',
              marginTop: '-5px',
            }}
          >
            <Typography variant="body2" color={`${theme.palette.grey[400]}`} sx={{ fontWeight: 'bold' }}>
              REWARDS
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {/* <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
                ~${formatNumber('0' || '0', 'USD')}
              </Typography> */}
              <AvatarGroup
                max={6}
                sx={{
                  '& .MuiAvatar-root': { width: 24, height: 24, borderColor: 'transparent' },
                  alignItems: 'center',
                }}
              >
                {rewardsTokens.map((symbol) => {
                  const isExaToken = symbol.length > 3 && symbol.startsWith('exa');
                  const imagePath = isExaToken ? `/img/exaTokens/${symbol}.svg` : `/img/assets/${symbol}.svg`;

                  return <Avatar key={symbol} alt={symbol} src={imagePath} />;
                })}
              </AvatarGroup>
            </Box>
          </Box>
        )}
      </Box>

      <Box display="flex" flexDirection="column" gap={1}>
        <MainActionButton
          fullWidth
          variant="contained"
          loading={isLoading}
          onClick={() => {
            submit();
            track('Button Clicked', {
              location: 'Staking',
              name: `${operation}`,
              value: qty,
              text: operation === 'deposit' ? t('Stake EXA') : t('Withdraw'),
            });
          }}
          data-testid="staking-submit"
          disabled={insufficientFunds}
        >
          {insufficientFunds && amount > 0n
            ? t('Insufficient EXA balance')
            : operation === 'deposit'
              ? balance && balance > 0
                ? t('Stake EXA and Claim rewards')
                : t('Stake EXA')
              : t('Withdraw')}
        </MainActionButton>
      </Box>
    </Box>
  );
}
export default React.memo(StakingEXAInput);
