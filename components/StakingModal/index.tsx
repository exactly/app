import React, { FC, forwardRef, ReactElement, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
  PaperProps,
  Paper,
  useMediaQuery,
  Slide,
  Avatar,
  Skeleton,
  InputBase,
} from '@mui/material';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import { splitSignature } from '@ethersproject/bytes';
import { TransitionProps } from '@mui/material/transitions';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';
import {
  formatEther,
  Hex,
  parseEther,
  parseUnits,
  hexToBigInt,
  keccak256,
  encodeAbiParameters,
  formatUnits,
} from 'viem';
import { GAS_LIMIT_MULTIPLIER, MAX_UINT256, WEI_PER_ETHER } from 'utils/const';
import { LoadingButton } from '@mui/lab';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork, useSignTypedData, useWalletClient } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import SocketAssetSelector from 'components/SocketAssetSelector';
import useSocketAssets from 'hooks/useSocketAssets';
import { AssetBalance } from 'types/Bridge';
import ModalInput from 'components/OperationsModal/ModalInput';
import Link from 'next/link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useEXAGaugeEarned } from 'hooks/useEXAGauge';
import { useEXA, useEXABalance } from 'hooks/useEXA';
import { SymbolGroup } from 'components/APRWithBreakdown';
import formatNumber from 'utils/formatNumber';
import { useProtoStaker, useProtoStakerPreviewETH } from 'hooks/useProtoStaker';
import Velodrome from 'components/Velodrome';
import useVELO from 'hooks/useVELO';
import { useEXAPoolGetReserves } from 'hooks/useEXAPool';
import ModalAlert from 'components/common/modal/ModalAlert';
import { ErrorData } from 'types/Error';
import handleOperationError from 'utils/handleOperationError';
import formatSymbol from 'utils/formatSymbol';
import { socketBuildTX, socketQuote } from 'utils/socket';
import useERC20 from 'hooks/useERC20';
import useIsPermit from 'hooks/useIsPermit';
import useIsContract from 'hooks/useIsContract';
import usePermit2 from 'hooks/usePermit2';
import useDelayedEffect from 'hooks/useDelayedEffect';

const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const MIN_SUPPLY = parseEther('0.002');

type ApprovalStatus = 'INIT' | 'ERC20' | 'ERC20-PERMIT2' | 'EXA' | 'APPROVED';

const gasLimit = (gas: bigint) => (gas * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER;

function PaperComponent(props: PaperProps | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} ref={ref} />
    </Draggable>
  );
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type StakingModalProps = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const StakingModal: FC<StakingModalProps> = ({ isOpen, open, close }) => {
  const { t } = useTranslation();
  const { isConnected, impersonateActive, exitImpersonate } = useWeb3();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { walletAddress, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const [errorData, setErrorData] = useState<ErrorData | undefined>(undefined);

  const [excess, setExcess] = useState({
    exa: 0n,
    eth: 0n,
  });

  const [input, setInput] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const exa = useEXA();
  const staker = useProtoStaker();

  const { veloPrice, poolAPR, userBalanceUSD } = useVELO();
  const { data: veloEarned } = useEXAGaugeEarned({ watch: true });
  const { data: exaBalance } = useEXABalance({ watch: true });
  const { data: previewETH } = useProtoStakerPreviewETH(exaBalance || 0n);
  const { data: reserves } = useEXAPoolGetReserves({ watch: true });

  const permit2 = usePermit2();
  const isPermit = useIsPermit();
  const isContract = useIsContract();

  const veloEarnedUSD = useMemo(() => {
    if (!veloEarned || !veloPrice) return undefined;
    return formatNumber(formatEther((veloEarned * parseEther(String(veloPrice))) / WEI_PER_ETHER));
  }, [veloEarned, veloPrice]);

  const assets = useSocketAssets();
  const [asset, setAsset] = useState<AssetBalance>();

  useEffect(() => {
    if (!assets) return;
    setAsset(assets.find((a) => a.symbol === 'ETH'));
  }, [assets]);

  const handleAssetChange = useCallback((asset_: AssetBalance) => {
    setErrorData(undefined);
    setAsset(asset_);
    setInput('');
  }, []);

  const { signTypedDataAsync } = useSignTypedData();

  const signEXA = useCallback(async () => {
    if (!exa || !staker || !walletAddress) return;

    const value = await exa.read.balanceOf([walletAddress]);
    const nonce = await exa.read.nonces([walletAddress]);
    const deadline = BigInt(dayjs().unix()) + 3_600n;

    const { v, r, s } = await signTypedDataAsync({
      domain: {
        name: 'exactly',
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
        spender: staker.address,
        value: value,
        nonce,
        deadline,
      },
      primaryType: 'Permit',
    }).then(splitSignature);

    return {
      owner: walletAddress,
      value,
      deadline,
      ...{ v, r: r as Hex, s: s as Hex },
    } as const;
  }, [displayNetwork.id, exa, signTypedDataAsync, staker, walletAddress]);

  const closeAndReset = useCallback(() => {
    close();
    setInput('');
    setErrorData(undefined);
  }, [close]);

  const exitAndClose = useCallback(() => {
    exitImpersonate();
    close();
  }, [close, exitImpersonate]);

  const submit = useCallback(async () => {
    setErrorData(undefined);
    if (!walletAddress || exaBalance === undefined || !staker || previewETH === undefined || !reserves || !opts) return;

    const supply = parseEther(input || '0');
    if (!exaBalance && !supply) {
      return setErrorData({ status: true, message: t('You have no EXA balance. Supply ETH in order to continue') });
    }

    setLoading(true);

    try {
      const minEXA = (((previewETH - supply) / 2n) * reserves[0]) / reserves[1];
      const value = supply;

      let hash: Hex | undefined;
      if (await isContract(walletAddress)) {
        const args = [walletAddress, exaBalance, minEXA, 0n] as const;
        const gas = await staker.estimateGas.stakeBalance(args, {
          ...opts,
          value,
        });
        hash = await staker.write.stakeBalance(args, {
          ...opts,
          value,
          gasLimit: gasLimit(gas),
        });
      } else {
        const permit = await signEXA();
        if (!permit) return;

        const args = [permit, minEXA, 0n] as const;
        const gas = await staker.estimateGas.stakeBalance(args, {
          ...opts,
          value,
        });
        hash = await staker.write.stakeBalance(args, {
          ...opts,
          value,
          gasLimit: gasLimit(gas),
        });
      }
      if (!hash) return;

      await waitForTransaction({ hash });

      setInput('');
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setLoading(false);
    }
  }, [walletAddress, exaBalance, staker, previewETH, reserves, opts, input, t, isContract, signEXA]);

  const { data: walletClient } = useWalletClient();

  const erc20 = useERC20(asset?.address === NATIVE_TOKEN_ADDRESS ? undefined : asset?.address);

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('INIT');
  const needsApproval = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !asset || !staker || !exa || !permit2 || !opts || exaBalance === undefined) {
      return true;
    }

    const supply = parseUnits(input || '0', asset.decimals);

    setApprovalStatus('INIT');
    try {
      if (await isContract(walletAddress)) {
        setApprovalStatus('EXA');
        const exaAllowance = await exa.read.allowance([walletAddress, staker.address], opts);
        if (exaAllowance < exaBalance) return true;

        if (erc20) {
          setApprovalStatus('ERC20');
          const erc20Allowance = await erc20.read.allowance([walletAddress, staker.address], opts);
          if (erc20Allowance < supply) return true;
        }
      } else if (erc20 && !(await isPermit(asset.address))) {
        setApprovalStatus('ERC20-PERMIT2');
        const allowance = await erc20.read.allowance([walletAddress, permit2.address], opts);
        if (allowance < supply) return true;
      }

      setApprovalStatus('APPROVED');
      return false;
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
      return true;
    }
  }, [asset, erc20, exa, exaBalance, input, isContract, isPermit, opts, permit2, staker, walletAddress]);

  const approve = useCallback(async () => {
    if (!asset || !staker || !exa || !erc20 || !permit2 || !opts || exaBalance === undefined) {
      return;
    }

    const supply = parseUnits(input || '0', asset.decimals);

    setLoading(true);
    try {
      let hash: Hex | undefined;
      switch (approvalStatus) {
        case 'EXA': {
          const args = [staker.address, exaBalance] as const;
          const gas = await exa.estimateGas.approve(args, opts);
          hash = await exa.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          break;
        }
        case 'ERC20': {
          const args = [staker.address, supply] as const;
          const gas = await erc20.estimateGas.approve(args, opts);
          hash = await erc20.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          break;
        }
        case 'ERC20-PERMIT2': {
          const args = [permit2.address, MAX_UINT256] as const;
          const gas = await erc20.estimateGas.approve(args, opts);
          hash = await erc20.write.approve(args, {
            ...opts,
            gasLimit: gasLimit(gas),
          });
          break;
        }
        default:
          return;
      }

      if (!hash) return;
      await waitForTransaction({ hash });
      setRequiresApproval(await needsApproval());
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setLoading(false);
    }
  }, [approvalStatus, asset, erc20, exa, exaBalance, input, needsApproval, opts, permit2, staker]);

  const [requiresApproval, setRequiresApproval] = useState(false);

  const load = useCallback(async () => {
    try {
      setRequiresApproval(await needsApproval());
      if (!asset) return;

      if (input === '' || previewETH === undefined || reserves === undefined) {
        return setExcess({ eth: 0n, exa: 0n });
      }

      setErrorData(undefined);

      const [exaReserves, wethReserves] = reserves;
      const supply = parseUnits(input, asset.decimals);
      if (asset.symbol === 'ETH') {
        if (supply === 0n || supply < previewETH) {
          setErrorData({
            status: true,
            message: t('You need to supply more than {{ value }} ETH', { value: formatEther(previewETH) }),
          });
          return setExcess({ eth: 0n, exa: 0n });
        }

        const extraETH = (supply - previewETH) / 2n;

        return setExcess({
          eth: extraETH,
          exa: (extraETH * exaReserves) / wethReserves,
        });
      } else {
        if (!walletAddress || !staker) return setExcess({ eth: 0n, exa: 0n });
        const {
          routes: [routeAsset],
        } = await socketQuote({
          fromChainId: 10,
          toChainId: 10,
          fromAmount: (previewETH * 101n) / 100n + MIN_SUPPLY,
          fromTokenAddress: NATIVE_TOKEN_ADDRESS,
          toTokenAddress: asset.address,
          userAddress: walletAddress,
          recipient: staker.address,
        });

        if (!routeAsset) return setExcess({ eth: 0n, exa: 0n });
        const previewAsset = BigInt(routeAsset.toAmount);

        if (supply === 0n || supply < previewAsset) {
          setErrorData({
            status: true,
            message: t('You need to supply more than {{ value }} {{ symbol }}', {
              value: formatUnits(previewAsset, asset.decimals),
              symbol: asset.symbol,
            }),
          });
          return setExcess({ eth: 0n, exa: 0n });
        }

        const extraAsset = (supply - previewAsset) / 2n;

        const {
          routes: [routeETH],
        } = await socketQuote({
          fromChainId: 10,
          toChainId: 10,
          fromAmount: extraAsset,
          fromTokenAddress: asset.address,
          toTokenAddress: NATIVE_TOKEN_ADDRESS,
          userAddress: walletAddress,
          recipient: staker.address,
        });

        if (!routeETH) return setExcess({ eth: 0n, exa: 0n });
        const extraETH = BigInt(routeETH.toAmount);

        return setExcess({
          eth: extraETH,
          exa: (extraETH * exaReserves) / wethReserves,
        });
      }
    } catch (e: unknown) {
      setErrorData({ status: true, message: handleOperationError(e) });
    }
  }, [asset, input, needsApproval, previewETH, reserves, staker, t, walletAddress]);

  const { isLoading: previewIsLoading } = useDelayedEffect({ effect: load });

  const sign = useCallback(async () => {
    if (!walletAddress || !asset || !erc20 || !permit2 || !staker) return;

    const deadline = BigInt(dayjs().unix() + 3_600);
    const value = parseUnits(input || '0', asset.decimals);
    const chainId = displayNetwork.id;

    if (await isPermit(asset.address)) {
      const nonce = await erc20.read.nonces([walletAddress], opts);
      const name = await erc20.read.name(opts);

      const { v, r, s } = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name,
          version: '1',
          chainId,
          verifyingContract: staker.address,
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
          spender: staker.address,
          value,
          nonce,
          deadline,
        },
      }).then(splitSignature);

      const permit = {
        owner: walletAddress,
        value,
        deadline,
        ...{ v, r: r as Hex, s: s as Hex },
      } as const;

      return { type: 'permit', value: permit } as const;
    }

    const signature = await signTypedDataAsync({
      primaryType: 'PermitTransferFrom',
      domain: {
        name: 'Permit2',
        chainId,
        verifyingContract: permit2.address,
      },
      types: {
        PermitTransferFrom: [
          { name: 'permitted', type: 'TokenPermissions' },
          { name: 'spender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
        TokenPermissions: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      message: {
        permitted: {
          token: asset.address,
          amount: value,
        },
        spender: staker.address,
        deadline,
        nonce: hexToBigInt(
          keccak256(
            encodeAbiParameters(
              [
                { name: 'sender', type: 'address' },
                { name: 'token', type: 'address' },
                { name: 'assets', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
              ],
              [walletAddress, asset.address, value, deadline],
            ),
          ),
        ),
      },
    });

    const permit = {
      amount: value,
      deadline,
      signature,
    } as const;

    return { type: 'permit2', value: permit } as const;
  }, [asset, displayNetwork.id, erc20, input, isPermit, opts, permit2, signTypedDataAsync, staker, walletAddress]);

  const socketSubmit = useCallback(async () => {
    if (
      !asset ||
      !walletAddress ||
      !walletClient ||
      !erc20 ||
      !opts ||
      !staker ||
      !reserves ||
      exaBalance === undefined ||
      previewETH === undefined
    ) {
      return;
    }

    const supply = parseUnits(input || '0', asset.decimals);
    if (!exaBalance && !supply) {
      return setErrorData({
        status: true,
        message: t('You have no EXA balance. Supply {{ symbol }} in order to continue', { symbol: asset.symbol }),
      });
    }

    setLoading(true);
    try {
      const {
        routes: [route],
      } = await socketQuote({
        fromChainId: 10,
        toChainId: 10,
        fromAmount: supply,
        fromTokenAddress: asset.address,
        toTokenAddress: NATIVE_TOKEN_ADDRESS,
        userAddress: walletAddress,
        recipient: staker.address,
      });

      if (!route) return;

      const { txData } = await socketBuildTX({ route });

      const [exaReserves, wethReserves] = reserves;
      const inETH = BigInt(route.toAmount);

      const minEXA = ((((inETH / 2n) * exaReserves) / wethReserves) * 98n) / 100n;

      const isMultiSig = await isContract(walletAddress);
      let hash: Hex | undefined;

      if (isMultiSig) {
        const args = [erc20.address, supply, txData, exaBalance, minEXA, 0n] as const;
        const gas = await staker.estimateGas.stakeAssetAndBalance(args, { ...opts });
        hash = await staker.write.stakeAssetAndBalance(args, {
          ...opts,
          gasLimit: gasLimit(gas),
        });
      } else {
        const [permit, permitEXA] = await Promise.all([sign(), signEXA()]);
        if (!permit || !permitEXA) return;
        switch (permit.type) {
          case 'permit': {
            const args = [erc20.address, permit.value, txData, permitEXA, minEXA, 0n] as const;
            const gas = await staker.estimateGas.stakeAssetAndBalance(args, { ...opts });
            hash = await staker.write.stakeAssetAndBalance(args, {
              ...opts,
              gasLimit: gasLimit(gas),
            });
            break;
          }
          case 'permit2': {
            const args = [erc20.address, permit.value, txData, permitEXA, minEXA, 0n] as const;
            const gas = await staker.estimateGas.stakeAssetAndBalance(args, { ...opts });
            hash = await staker.write.stakeAssetAndBalance(args, {
              ...opts,
              gasLimit: gasLimit(gas),
            });
            break;
          }
        }
      }

      if (!hash) return;

      const { status } = await waitForTransaction({ hash });
      if (status === 'reverted') throw new Error('Transaction reverted');
      setInput('');
    } catch (err) {
      setErrorData({ status: true, message: handleOperationError(err) });
    } finally {
      setLoading(false);
    }
  }, [
    asset,
    walletAddress,
    walletClient,
    erc20,
    opts,
    staker,
    reserves,
    exaBalance,
    previewETH,
    input,
    t,
    isContract,
    sign,
    signEXA,
  ]);

  return (
    <>
      <Velodrome onClick={open} />
      <Dialog
        open={isOpen}
        onClose={closeAndReset}
        PaperComponent={isMobile ? undefined : PaperComponent}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            minWidth: '400px',
            maxWidth: '424px !important',
            width: '100%',
            overflowY: 'hidden !important',
          },
        }}
        TransitionComponent={isMobile ? Transition : undefined}
        fullScreen={isMobile}
        sx={isMobile ? { top: 'auto' } : { backdropFilter: loading ? 'blur(1.5px)' : '' }}
        disableEscapeKeyDown={loading}
      >
        {!loading && (
          <IconButton
            aria-label="close"
            onClick={closeAndReset}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'grey.400',
            }}
          >
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>
        )}
        <Box px={4} pt={4} pb={3}>
          <DialogTitle
            sx={{
              p: 0,
              mb: 2,
              cursor: { xs: '', sm: 'move' },
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            {t('Supplied')}
          </DialogTitle>
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography fontSize={14}>
                {userBalanceUSD
                  ? t(
                      "As a liquidity provider, you've begun accruing VELO rewards relative to your stake's size and duration, claimable at any time.",
                    )
                  : t('Provide EXA liquidity on Velodrome to earn VELO rewards.')}
              </Typography>
              <Box bgcolor="grey.100" borderRadius="8px">
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.5} p={0.75} px={2}>
                  <Typography fontSize={13} fontWeight={500}>
                    {t('Emissions APR')}
                  </Typography>
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Avatar
                      alt="Velodrome Token"
                      src={`/img/assets/VELO.svg`}
                      sx={{ width: 14, height: 14, fontSize: 10, borderColor: 'transparent' }}
                    />
                    {poolAPR ? (
                      <Typography fontSize={14} fontWeight={500}>
                        {poolAPR}
                      </Typography>
                    ) : (
                      <Skeleton width={48} height={24} />
                    )}
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.5} p={0.75} px={2}>
                  <Typography fontSize={13} fontWeight={500}>
                    {t('Your current balance')}
                  </Typography>
                  <Box display="flex" gap={0.5} alignItems="center">
                    <SymbolGroup size={14} symbols={['EXA', 'WETH']} />
                    <Typography fontSize={14} fontWeight={500}>
                      ${formatNumber(formatEther(userBalanceUSD ?? 0n))}
                    </Typography>
                  </Box>
                </Box>

                <Link target="_blank" href="https://velodrome.finance/dash" rel="noreferrer noopener">
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.5} p={0.75} px={2}>
                    <Box display="flex" gap={0.5} alignItems="center">
                      <Typography fontSize={13} fontWeight={500}>
                        {t('Your VELO rewards')}
                      </Typography>
                      <OpenInNewIcon
                        sx={{
                          height: '10px',
                          width: '10px',
                          color: ({ palette }) => (palette.mode === 'light' ? 'figma.grey.600' : 'grey.900'),
                        }}
                      />
                    </Box>
                    <Box display="flex" gap={0.5} alignItems="center">
                      <Avatar
                        alt="Velodrome Token"
                        src={`/img/assets/VELO.svg`}
                        sx={{ width: 14, height: 14, fontSize: 10, borderColor: 'transparent' }}
                      />
                      <Typography fontSize={14} fontWeight={500}>
                        ${veloEarnedUSD || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Link>
              </Box>
            </Box>
          </DialogContent>
        </Box>
        <Box px={4} pb={4}>
          <DialogTitle
            sx={{
              p: 0,
              mb: 2,
              cursor: { xs: '', sm: 'move' },
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            {t('Supply EXA/ETH')}
          </DialogTitle>
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Typography fontSize={12} px={2}>
                    {t('Provide EXA liquidity')}
                  </Typography>
                  <PoolPreview
                    exa={formatEther((exaBalance || 0n) + excess.exa)}
                    eth={formatEther((previewETH || 0n) + excess.eth)}
                    loading={previewIsLoading}
                  />
                </Box>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Typography fontSize={12} px={2}>
                    {t('Add more liquidity')}
                  </Typography>
                  <ModalBox sx={{ display: 'flex', flexDirection: 'row', p: 1, px: 2, alignItems: 'center' }}>
                    {assets && asset ? (
                      <>
                        <Box width={'25%'}>
                          <SocketAssetSelector asset={asset} options={assets} onChange={handleAssetChange} />
                        </Box>
                        <ModalInput
                          decimals={asset.decimals}
                          symbol={asset.symbol}
                          value={input}
                          onValueChange={setInput}
                          align="right"
                          maxWidth="100%"
                          sx={{ paddingTop: 0, fontSize: 16 }}
                        />
                      </>
                    ) : (
                      <Skeleton variant="rectangular" height={20} width="100%" />
                    )}
                  </ModalBox>
                </Box>
              </Box>
              {errorData?.status && <ModalAlert message={errorData.message} variant={errorData.variant} mb={0} />}
              <Box mt={errorData ? 0 : 2}>
                {impersonateActive ? (
                  <Button fullWidth onClick={exitAndClose} variant="contained">
                    {t('Exit Read-Only Mode')}
                  </Button>
                ) : chain && chain.id !== displayNetwork.id ? (
                  <LoadingButton
                    fullWidth
                    onClick={() => switchNetwork?.(displayNetwork.id)}
                    variant="contained"
                    loading={switchIsLoading}
                    disabled={!isConnected}
                  >
                    {t('Please switch to {{network}} network', { network: displayNetwork.name })}
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    fullWidth
                    variant="contained"
                    onClick={asset?.symbol === 'ETH' ? submit : requiresApproval ? approve : socketSubmit}
                    disabled={!isConnected || previewIsLoading || !input || Boolean(errorData)}
                    loading={loading || previewIsLoading}
                  >
                    {requiresApproval
                      ? t('Approve {{ asset }}', { asset: approvalStatus === 'EXA' ? 'EXA' : asset?.symbol })
                      : t('Supply EXA/ETH')}
                  </LoadingButton>
                )}
              </Box>
            </Box>
          </DialogContent>
        </Box>
      </Dialog>
    </>
  );
};

type PoolPreviewProps = {
  exa: string;
  eth: string;
  loading: boolean;
};

const PoolPreview: FC<PoolPreviewProps> = ({ exa, eth, loading }) => {
  return (
    <ModalBox sx={{ bgcolor: 'grey.100', px: 2, py: 1 }}>
      <ModalBoxRow>
        <ModalBoxCell>
          <PoolAsset symbol="EXA" amount={exa} loading={loading} />
        </ModalBoxCell>
        <ModalBoxCell divisor>
          <PoolAsset symbol="WETH" amount={eth} loading={loading} />
        </ModalBoxCell>
      </ModalBoxRow>
    </ModalBox>
  );
};

type PoolAsset = {
  symbol: string;
  amount: string;
  loading: boolean;
};

const PoolAsset: FC<PoolAsset> = ({ symbol, amount, loading }) => {
  return (
    <Box display="flex" gap={1} alignItems="center" justifyContent="space-between">
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar
          alt={`${formatSymbol(symbol)} Token`}
          src={`/img/assets/${symbol}.svg`}
          sx={{
            width: 20,
            height: 20,
            fontSize: 10,
            borderColor: 'transparent',
          }}
        />
        <Typography fontSize={16} fontWeight={500}>
          {formatSymbol(symbol)}
        </Typography>
      </Box>
      {loading ? (
        <Skeleton width="100%" />
      ) : (
        <InputBase
          inputProps={{
            min: 0.0,
            type: 'number',
            value: amount,
            step: 'any',
            style: { textAlign: 'right', padding: 0, height: 'fit-content', cursor: 'default' },
          }}
          sx={{ fontSize: 15 }}
        />
      )}
    </Box>
  );
};

export default StakingModal;
