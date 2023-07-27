import React, { FC, forwardRef, ReactElement, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
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
} from '@mui/material';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import { splitSignature } from '@ethersproject/bytes';
import { TransitionProps } from '@mui/material/transitions';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';
import { formatEther, Hex, parseEther } from 'viem';
import { Transaction } from 'types/Transaction';
import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from 'utils/const';
import { LoadingButton } from '@mui/lab';
import { useWeb3 } from 'hooks/useWeb3';
import { erc20ABI, useNetwork, usePublicClient, useSwitchNetwork, useWalletClient, useSignTypedData } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import SocketAssetSelector from 'components/SocketAssetSelector';
import useSocketAssets from 'hooks/useSocketAssets';
import { AssetBalance } from 'types/Bridge';
import ModalInput from 'components/OperationsModal/ModalInput';
import Link from 'next/link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { socketBuildTX, socketQuote } from 'utils/socket';
import { useEXAGaugeEarned } from 'hooks/useEXAGauge';
import { useEXA, useEXABalance } from 'hooks/useEXA';
import { SymbolGroup } from 'components/APRWithBreakdown';
import formatNumber from 'utils/formatNumber';
import { useProtoStaker, useProtoStakerPreviewETH } from 'hooks/useProtoStaker';
import Velodrome from 'components/Velodrome';
import useVelo from 'hooks/useVelo';
import { useEXAPoolGetReserves } from 'hooks/useEXAPool';
import ModalAlert from 'components/common/modal/ModalAlert';
import { ErrorData } from 'types/Error';
import handleOperationError from 'utils/handleOperationError';
import Loading from 'components/common/modal/Loading';

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

const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const slippage = (value: bigint) => (value * 1001n) / 1000n;

const StakingModal: FC<StakingModalProps> = ({ isOpen, open, close }) => {
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { walletAddress, chain: displayNetwork, opts } = useWeb3();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [errorData, setErrorData] = useState<ErrorData | undefined>(undefined);

  const [input, setInput] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);
  const disableSubmit = useMemo(() => false, []);

  const exa = useEXA();
  const protoStaker = useProtoStaker();
  const { veloPrice, poolAPR, userBalanceUSD } = useVelo();
  const staker = useProtoStaker();
  const { data: veloEarned } = useEXAGaugeEarned();
  const { data: exaBalance } = useEXABalance({ watch: true });
  const { data: previewETH } = useProtoStakerPreviewETH(exaBalance || 0n);
  const { data: reserves } = useEXAPoolGetReserves();

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
    setAsset(asset_);
    setInput('');
  }, []);

  const { signTypedDataAsync } = useSignTypedData();

  const sign = useCallback(async () => {
    if (!exa || !staker || !walletAddress) return;

    const value = await exa.read.balanceOf([walletAddress]);
    const nonce = await exa.read.nonces([walletAddress]);
    const deadline = BigInt(dayjs().unix()) + 3_600n;

    const { v, r, s } = await signTypedDataAsync({
      domain: {
        name: 'exactly',
        version: '1',
        chainId: displayNetwork.id,
        verifyingContract: exa?.address,
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
    setTx(undefined);
    setErrorData(undefined);
  }, [close]);

  const { data: walletClient } = useWalletClient({ chainId: chain?.id });
  const publicClient = usePublicClient({ chainId: chain?.id });

  const submit = useCallback(async () => {
    if (!protoStaker || !previewETH || !reserves || !opts) return;

    setLoading(true);

    try {
      const permit = await sign();
      if (!permit) return;

      const supply = parseEther(input);
      const minEXA = ((supply / 2n) * reserves[0]) / reserves[1];

      const value = slippage(previewETH + supply);

      const args = [permit, minEXA, 0n] as const;
      const gas = await protoStaker.estimateGas.stakeBalance(args, {
        value,
        ...opts,
      });
      const hash = await protoStaker.write.stakeBalance(args, {
        value,
        gasLimit: (gas * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER,
        ...opts,
      });

      setTx({ hash, status: 'loading' });
      const { status, transactionHash } = await waitForTransaction({ hash });
      setTx({ hash: transactionHash, status: status === 'success' ? 'success' : 'error' });
    } catch (e: unknown) {
      console.log(e);
      setErrorData({ status: true, message: handleOperationError(e) });
    } finally {
      setLoading(false);
    }
  }, [protoStaker, previewETH, reserves, opts, sign, input]);

  const confirm = useCallback(async () => {
    if (!asset || !walletAddress || !walletClient) return;

    const {
      routes: [route],
      destinationCallData,
    } = await socketQuote({
      fromChainId: 10,
      toChainId: 10,
      fromAmount: Number(input) * 10 ** asset.decimals,
      fromTokenAddress: asset.address,
      toTokenAddress: NATIVE_TOKEN_ADDRESS,
      userAddress: walletAddress,
    });

    const {
      userTxs: [{ approvalData }],
    } = route;

    if (!approvalData) return;

    try {
      const allowance = await publicClient.readContract({
        abi: erc20ABI,
        address: approvalData.approvalTokenAddress,
        functionName: 'allowance',
        args: [walletAddress, approvalData.allowanceTarget],
      });

      if (allowance < BigInt(approvalData.minimumApprovalAmount)) {
        const { request } = await publicClient.simulateContract({
          abi: erc20ABI,
          address: approvalData.approvalTokenAddress,
          account: walletAddress,
          functionName: 'approve',
          args: [approvalData.allowanceTarget, BigInt(approvalData.minimumApprovalAmount)],
        });

        await walletClient.writeContract(request);
      }

      // confirm part

      const { txTarget, txData, value } = await socketBuildTX({ route, destinationCallData });

      const txHash_ = await walletClient.sendTransaction({
        to: txTarget,
        data: txData,
        value: BigInt(value),
      });

      // eslint-disable-next-line no-console
      console.log(txHash_);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }, [asset, publicClient, input, walletAddress, walletClient]);

  if (!walletAddress) {
    return null;
  }

  if (tx) {
    return <Loading tx={tx} />;
  }

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
        sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
        disableEscapeKeyDown={loadingTx}
      >
        {!loadingTx && (
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
                      "As a liquidity provider, you've begun accruing $VELO rewards relative to your stake's size and duration, claimable at any time.",
                    )
                  : t('Provide EXA liquidity on Velodrome to earn $VELO rewards.')}
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

                <Link
                  target="_blank"
                  href="https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth&stable=false"
                  rel="noreferrer noopener"
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={0.5} p={0.75} px={2}>
                    <Box display="flex" gap={0.5} alignItems="center">
                      <Typography fontSize={13} fontWeight={500}>
                        {t('Your $VELO rewards')}
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
                  <PoolPreview exa={formatEther(exaBalance || 0n)} eth={formatEther(previewETH || 0n)} />
                </Box>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Typography fontSize={12} px={2}>
                    {t('Add more liquidity')}
                  </Typography>
                  <ModalBox sx={{ display: 'flex', flexDirection: 'row', p: 1, px: 2, alignItems: 'center' }}>
                    {assets && asset ? (
                      <>
                        <Box width={'25%'}>
                          <SocketAssetSelector asset={asset} options={assets} onChange={handleAssetChange} disabled />
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
              <Box>
                {chain && chain.id !== displayNetwork.id ? (
                  <LoadingButton
                    fullWidth
                    onClick={() => switchNetwork?.(displayNetwork.id)}
                    variant="contained"
                    loading={switchIsLoading}
                  >
                    {t('Please switch to {{network}} network', { network: displayNetwork.name })}
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    fullWidth
                    variant="contained"
                    disabled={disableSubmit}
                    onClick={submit}
                    loading={loading}
                  >
                    {t('Supply EXA/ETH')}
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
};

const PoolPreview: FC<PoolPreviewProps> = ({ exa, eth }) => {
  return (
    <ModalBox sx={{ height: 48, bgcolor: 'grey.100' }}>
      <ModalBoxRow>
        <ModalBoxCell height={32}>
          <Box position="relative" gap={0.5} alignItems="center">
            <Box display="flex" alignItems="center" gap={0.8} position="absolute" top={3} left={0}>
              <Avatar
                alt="EXA Token"
                src={`/img/assets/EXA.svg`}
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: 10,
                  borderColor: 'transparent',
                }}
              />
              <Typography fontSize={16} fontWeight={500}>
                EXA
              </Typography>
            </Box>
            <Box maxWidth="58%" overflow="auto" height={32} position="absolute" top={3} left={66}>
              <Typography fontSize={16}>{exa}</Typography>
            </Box>
          </Box>
        </ModalBoxCell>
        <ModalBoxCell divisor height={32}>
          <Box position="relative" gap={0.5} alignItems="center">
            <Box display="flex" alignItems="center" gap={0.8} position="absolute" top={3} left={0}>
              <Avatar
                alt="WETH Token"
                src={`/img/assets/WETH.svg`}
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: 10,
                  borderColor: 'transparent',
                }}
              />
              <Typography fontSize={16} fontWeight={500}>
                ETH
              </Typography>
            </Box>
            <Box maxWidth="58%" overflow="auto" height={32} position="absolute" top={3} left={66}>
              <Typography fontSize={16}>{eth}</Typography>
            </Box>
          </Box>
        </ModalBoxCell>
      </ModalBoxRow>
    </ModalBox>
  );
};

export default StakingModal;
