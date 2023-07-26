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
  Checkbox,
  Button,
  Collapse,
  TextField,
  FormControlLabel,
  AvatarGroup,
  Avatar,
  ButtonBase,
  Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { CheckboxIcon, CheckboxCheckedIcon } from 'components/Icons';
import { Address, formatEther, isAddress } from 'viem';
import { formatWallet, toPercentage } from 'utils/utils';
import formatNumber from 'utils/formatNumber';
import { Transaction } from 'types/Transaction';
import Loading from 'components/common/modal/Loading';
import useRewards from 'hooks/useRewards';
import { WEI_PER_ETHER } from 'utils/const';
import { LoadingButton } from '@mui/lab';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import SocketAssetSelector from 'components/SocketAssetSelector';
import useSocketAssets from 'hooks/useSocketAssets';
import { optimism } from 'wagmi/dist/chains';
import { AssetBalance } from 'types/Bridge';
import ModalInput from 'components/OperationsModal/ModalInput';
import { set } from 'cypress/types/lodash';
import Link from 'next/link';

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
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { walletAddress, chain: displayNetwork } = useWeb3();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const { rewards: rs, claim } = useRewards();

  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [input, setInput] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Object.keys(rs).map((k) => [k, true])),
  );
  const [loading, setLoading] = useState<boolean>(false);

  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);
  const differentAddress = useMemo(() => (input && isAddress(input) ? formatWallet(input) : ''), [input]);
  const disableSubmit = useMemo(
    () => (showInput && !differentAddress) || Object.values(selected).every((v) => v === false),
    [differentAddress, selected, showInput],
  );

  const velodromeAPR = 0.4;
  const balanceEXA = '9.1111';
  const balanceETH = '8.1111';
  const veloRewards = '9.1111111';

  const assets = useSocketAssets();
  const [asset, setAsset] = useState<AssetBalance>();
  const [qtyIn, setQtyIn] = useState('');

  useEffect(() => {
    if (!assets) return;
    setAsset(assets.find((a) => a.symbol === 'ETH'));
  }, [assets]);

  const handleAssetChange = useCallback((asset_: AssetBalance) => {
    setAsset(asset_);
    setQtyIn('');
  }, []);

  const submit = useCallback(async () => {
    const assets_ = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([symbol]) => symbol);
    setLoading(true);
    claim({ assets: assets_, to: showInput && isAddress(input) ? input : undefined, setTx }).finally(() =>
      setLoading(false),
    );
  }, [claim, input, selected, showInput]);

  const rewards = useMemo(
    () =>
      Object.entries(rs).map(([symbol, { amount, usdPrice }]) => ({
        symbol,
        amount: formatEther(amount),
        valueUSD: usdPrice ? formatEther((amount * usdPrice) / WEI_PER_ETHER) : undefined,
      })),
    [rs],
  );

  const totalAmount = useMemo(
    () => Object.values(rs).reduce((acc, { amount, usdPrice }) => acc + (amount * usdPrice) / WEI_PER_ETHER, 0n),
    [rs],
  );

  const closeAndReset = useCallback(() => {
    close();
    setShowInput(false);
    setSelected(Object.fromEntries(Object.keys(rs).map((k) => [k, true])));
    setInput('');
    setTx(undefined);
  }, [close, rs]);

  if (!walletAddress) {
    return null;
  }

  return (
    <>
      <Button variant="outlined" onClick={open}>
        <Box display="flex" gap={0.5} alignItems="center">
          <Avatar
            alt="Velodrome Token"
            src={`/img/assets/VELO.svg`}
            sx={{ width: 16, height: 16, fontSize: 10, borderColor: 'transparent' }}
          />
          <Typography fontSize={14} fontWeight={700}>
            {toPercentage(velodromeAPR)}
          </Typography>
        </Box>
      </Button>
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
                {balanceETH || balanceEXA
                  ? t(
                      "As a liquidity provider, you've begun accruing $VELO rewards relative to your stake's size and duration, claimable at any time.",
                    )
                  : t('Stake your EXA in Velodrome pools to earn $VELO rewards.')}
              </Typography>
              <PoolPreview exa={String(balanceEXA)} eth={String(balanceETH)} />
              <Link
                target="_blank"
                href="https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth&stable=false"
                rel="noreferrer noopener"
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={0.5}
                  bgcolor="grey.100"
                  p={0.75}
                  borderRadius="4px"
                  px={2}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography fontSize={13} fontWeight={500}>
                    {t('Your $VELO rewards')}:
                  </Typography>
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Avatar
                      alt="Velodrome Token"
                      src={`/img/assets/VELO.svg`}
                      sx={{ width: 14, height: 14, fontSize: 10, borderColor: 'transparent' }}
                    />
                    <Typography fontSize={14} fontWeight={500}>
                      {veloRewards}
                    </Typography>
                  </Box>
                </Box>
              </Link>
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
                <PoolPreview exa={String(balanceEXA)} eth={String(balanceETH)} />
                <ModalBox sx={{ display: 'flex', flexDirection: 'row', p: 2, alignItems: 'center' }}>
                  {assets && asset ? (
                    <>
                      <Box width={'25%'}>
                        <SocketAssetSelector asset={asset} options={assets} onChange={handleAssetChange} />
                      </Box>
                      <Box flex={1}>
                        <ModalInput
                          decimals={asset.decimals}
                          symbol={asset.symbol}
                          value={qtyIn}
                          onValueChange={setQtyIn}
                          align="right"
                          maxWidth="100%"
                        />
                      </Box>
                    </>
                  ) : (
                    <Skeleton />
                  )}
                </ModalBox>
              </Box>
              <Box display="flex" flexDirection="column" gap={2} alignItems="center">
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
    <ModalBox sx={{ height: 48 }}>
      <ModalBoxRow>
        <ModalBoxCell height={32}>
          <Box position="relative" gap={0.5} alignItems="center">
            <Avatar
              alt="Velodrome Token"
              src={`/img/assets/EXA.svg`}
              sx={{
                position: 'absolute',
                top: 7,
                left: 0,
                width: 16,
                height: 16,
                fontSize: 10,
                borderColor: 'transparent',
              }}
            />
            <Box maxWidth="83%" overflow="auto" height={32} position="absolute" top={5} left={24}>
              <Typography fontSize={14}>{exa}</Typography>
            </Box>
          </Box>
        </ModalBoxCell>
        <ModalBoxCell divisor height={32}>
          <Box position="relative" gap={0.5} alignItems="center">
            <Avatar
              alt="Velodrome Token"
              src={`/img/assets/WETH.svg`}
              sx={{
                position: 'absolute',
                top: 7,
                left: 0,
                width: 16,
                height: 16,
                fontSize: 10,
                borderColor: 'transparent',
              }}
            />
            <Box maxWidth="83%" overflow="auto" height={32} position="absolute" top={5} left={24}>
              <Typography fontSize={14}>{eth}</Typography>
            </Box>
          </Box>
        </ModalBoxCell>
      </ModalBoxRow>
    </ModalBox>
  );
};

export default StakingModal;
