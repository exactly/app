import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { type Hex, formatEther, parseEther } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import { stakedExaABI } from 'types/abi';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction, ExtractAbiFunctionNames } from 'abitype';
import Draggable from 'react-draggable';
import CloseIcon from '@mui/icons-material/Close';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import { ModalBox } from 'components/common/modal/ModalBox';

import ModalInput from 'components/OperationsModal/ModalInput';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import MainActionButton from 'components/common/MainActionButton';
import Image from 'next/image';
import { useEXA, useEXABalance, useEXAPrice } from 'hooks/useEXA';
import { useStakedEXA, useStakedEXABalance } from 'hooks/useStakedEXA';
import formatNumber from 'utils/formatNumber';
import { gasLimit } from 'utils/gas';
import { Transaction } from 'types/Transaction';
import LoadingTransaction from 'components/common/modal/Loading';
import { track } from 'utils/mixpanel';
import { useStakeEXA } from 'contexts/StakeEXAContext';
import dayjs from 'dayjs';
import { useSignTypedData } from 'wagmi';
import { splitSignature } from '@ethersproject/bytes';
import useIsContract from 'hooks/useIsContract';

type Params<T extends ExtractAbiFunctionNames<typeof stakedExaABI>> = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof stakedExaABI, T>['inputs']
>;

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

  const exa = useEXA();
  const stakedEXA = useStakedEXA();
  const { data: balance, isLoading: balanceIsLoading } = useStakedEXABalance();
  const { data: exaBalance, isLoading: exaBalanceIsLoading } = useEXABalance();
  const { rewardsTokens } = useStakeEXA();
  const EXAPrice = useEXAPrice();
  const { isConnected, opts, walletAddress, chain: displayNetwork } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [tx, setTx] = useState<Transaction>();
  const { signTypedDataAsync } = useSignTypedData();
  const isContract = useIsContract();

  const [qty, setQty] = useState<string>('');
  const theme = useTheme();
  const usdValue = useMemo(() => {
    if (!qty || !EXAPrice) return;

    const parsedQty = parseEther(qty);
    const usd = (parsedQty * EXAPrice) / WAD;

    return formatEther(usd);
  }, [EXAPrice, qty]);

  const insufficientFunds = useMemo(() => {
    return operation === 'deposit'
      ? parseEther(qty) > (exaBalance || 0n) || !qty
      : parseEther(qty) > (balance || 0n) || !qty;
  }, [balance, exaBalance, operation, qty]);

  const sign = useCallback(async () => {
    if (!walletAddress || !exa || !stakedEXA) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const _qty = parseEther(qty);
    const value = _qty + 1n;

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
        spender: stakedEXA.address,
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
  }, [displayNetwork.id, exa, opts, qty, signTypedDataAsync, stakedEXA, walletAddress]);

  const submit = useCallback(async () => {
    if (!walletAddress || !stakedEXA || !exa || !opts || !qty) return;

    setIsLoading(true);
    const amount = parseEther(qty);

    let hash;
    try {
      if (operation === 'deposit') {
        if (await isContract(walletAddress)) {
          const args: Params<'deposit'> = [amount, walletAddress] as const;
          const allowance = await exa.read.allowance([walletAddress, stakedEXA.address]);

          if (allowance < amount) {
            const approve = [stakedEXA.address, amount] as const;
            const gas = await exa.estimateGas.approve(approve, opts);
            const approveHash = await exa.write.approve(approve, { ...opts, gasLimit: gasLimit(gas) });
            await waitForTransaction({ hash: approveHash });
          }

          const gas = await stakedEXA.estimateGas.deposit(args, opts);
          hash = await stakedEXA.write.deposit(args, { ...opts, gasLimit: gasLimit(gas) });
        } else {
          const p = await sign();
          if (!p) return;
          const args: Params<'permitAndDeposit'> = [amount, walletAddress, p] as const;
          const gas = await stakedEXA.estimateGas.permitAndDeposit(args, opts);
          hash = await stakedEXA.write.permitAndDeposit(args, { ...opts, gasLimit: gasLimit(gas) });
        }

        setTx({ status: 'processing', hash });

        const { status, transactionHash } = await waitForTransaction({ hash });

        setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
      } else {
        const args: Params<'withdraw'> = [amount, walletAddress, walletAddress] as const;

        const gas = await stakedEXA.estimateGas.withdraw(args, opts);
        hash = await stakedEXA.write.withdraw(args, { ...opts, gasLimit: gasLimit(gas) });
        setTx({ status: 'processing', hash });

        const { status, transactionHash } = await waitForTransaction({ hash });

        setTx({ status: status === 'success' ? 'success' : 'error', hash: transactionHash });
      }
    } catch (e) {
      if (hash) setTx({ status: 'error', hash });
    } finally {
      refetch();
      setIsLoading(false);
    }
  }, [walletAddress, stakedEXA, exa, opts, qty, operation, isContract, sign, refetch]);

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
              <Typography color="figma.grey.500" fontWeight={500} fontSize={13} fontFamily="fontFamilyMonospaced">
                ~${formatNumber('0' || '0', 'USD')}
              </Typography>
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
          {insufficientFunds && parseEther(qty) > 0n
            ? t('Insufficient EXA balance')
            : operation === 'deposit'
              ? t('Stake EXA')
              : t('Withdraw')}
        </MainActionButton>
      </Box>
    </Box>
  );
}
export default React.memo(StakingEXAInput);
