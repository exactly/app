import React, { FC, forwardRef, ReactElement, Ref, useCallback, useMemo, useRef, useState } from 'react';
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
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { CheckboxIcon, CheckboxCheckedIcon } from 'components/Icons';
import { formatEther, isAddress } from 'viem';
import { formatWallet } from 'utils/utils';
import formatNumber from 'utils/formatNumber';
import { Transaction } from 'types/Transaction';
import Loading from 'components/common/modal/Loading';
import useRewards from 'hooks/useRewards';
import { WEI_PER_ETHER } from 'utils/const';
import { LoadingButton } from '@mui/lab';
import { useWeb3 } from 'hooks/useWeb3';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import RewardsTooltip from 'components/RewardsTooltip';
import { useModal } from 'contexts/ModalContext';

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

type RewardsModalProps = {
  isOpen: boolean;
  close: () => void;
};

const RewardsModal: FC<RewardsModalProps> = ({ isOpen, close }) => {
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const { walletAddress, chain: displayNetwork, impersonateActive, exitImpersonate } = useWeb3();
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

  const submit = useCallback(async () => {
    const assets = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([symbol]) => symbol);
    setLoading(true);
    claim({ assets, to: showInput && isAddress(input) ? input : undefined, setTx }).finally(() => setLoading(false));
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

  const closeAndReset = useCallback(() => {
    close();
    setShowInput(false);
    setSelected(Object.fromEntries(Object.keys(rs).map((k) => [k, true])));
    setInput('');
    setTx(undefined);
  }, [close, rs]);

  const exitAndClose = useCallback(() => {
    exitImpersonate();
    closeAndReset();
  }, [closeAndReset, exitImpersonate]);

  if (!walletAddress) {
    return null;
  }

  return (
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
      <Box p={4}>
        {!tx && (
          <DialogTitle
            sx={{
              p: 0,
              mb: 3,
              cursor: { xs: '', sm: 'move' },
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            {t('Claim Your Rewards')}
          </DialogTitle>
        )}
        {tx ? (
          <DialogContent>
            <Loading
              tx={tx}
              messages={{
                pending: t('You are claiming your rewards'),
                success: t('You have claimed your rewards'),
                error: t('Something went wrong'),
              }}
            />
          </DialogContent>
        ) : (
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            <Box display="flex" flexDirection="column" gap={4}>
              <Typography fontSize={14}>
                {t(
                  'Access your rewards that are ready for claiming. You can claim them directly to your connected wallet or to a different wallet address of your choice.',
                )}
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {rewards.map(({ symbol, amount, valueUSD }) => (
                  <FormControlLabel
                    key={symbol}
                    sx={{
                      py: 1,
                      pr: 1,
                      pl: 2,
                      m: 0,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: ({ palette }) =>
                        `1px solid ${selected[symbol] ? (palette.mode === 'dark' ? 'white' : 'black') : 'transparent'}`,
                      '&:hover': {
                        bgcolor: 'figma.grey.50',
                      },
                    }}
                    labelPlacement="start"
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Image
                          src={`/img/assets/${symbol}.svg`}
                          alt={symbol}
                          width={24}
                          height={24}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                        />
                        <Typography variant="h6">{formatNumber(amount, symbol)}</Typography>
                        {valueUSD && <Typography fontSize={14}>${formatNumber(valueUSD, 'USD')}</Typography>}
                      </Box>
                    }
                    control={
                      <Checkbox
                        checked={selected[symbol]}
                        icon={<CheckboxIcon sx={{ fontSize: 18 }} />}
                        checkedIcon={<CheckboxCheckedIcon sx={{ fontSize: 18 }} />}
                        onChange={(_, checked) => setSelected((prev) => ({ ...prev, [symbol]: checked }))}
                      />
                    }
                  />
                ))}
                <Collapse in={showInput}>
                  <Box mt={2.5}>
                    <TextField
                      variant="outlined"
                      fullWidth
                      size="small"
                      placeholder={t('Enter address')}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          p: 0.5,
                          fontSize: 14,
                          '&.Mui-focused fieldset': {
                            border: '1px solid',
                          },
                        },
                      }}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </Box>
                </Collapse>
              </Box>
              <Box display="flex" flexDirection="column" gap={2} alignItems="center">
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
                  >
                    {t('Please switch to {{network}} network', { network: displayNetwork.name })}
                  </LoadingButton>
                ) : (
                  <>
                    <LoadingButton
                      fullWidth
                      variant="contained"
                      disabled={disableSubmit}
                      onClick={submit}
                      loading={loading}
                    >
                      {showInput ? `${t('Claim to')} ${differentAddress}` : t('Claim to connected wallet')}
                    </LoadingButton>
                    <ButtonBase onClick={() => setShowInput(!showInput)} disableRipple>
                      <Typography fontSize={12} color="grey.500" sx={{ cursor: 'pointer' }}>
                        {t('or')}{' '}
                        <span style={{ textDecoration: 'underline' }}>
                          {showInput ? t('Claim to connected wallet').toLowerCase() : t('claim to a different address')}
                        </span>
                      </Typography>
                    </ButtonBase>
                  </>
                )}
              </Box>
            </Box>
          </DialogContent>
        )}
      </Box>
    </Dialog>
  );
};

export function RewardsButton() {
  const { t } = useTranslation();
  const { open } = useModal('rewards');
  const { rewards: rs } = useRewards();

  const rewards = useMemo(
    () =>
      Object.entries(rs)
        .map(([symbol, { amount, usdPrice }]) => ({
          symbol,
          amount: formatEther(amount),
          valueUSD: usdPrice ? formatEther((amount * usdPrice) / WEI_PER_ETHER) : undefined,
        }))
        .sort((a, b) => (b.valueUSD ? parseFloat(b.valueUSD) : 0) - (a.valueUSD ? parseFloat(a.valueUSD) : 0)),
    [rs],
  );

  const totalAmount = useMemo(
    () => Object.values(rs).reduce((acc, { amount, usdPrice }) => acc + (amount * usdPrice) / WEI_PER_ETHER, 0n),
    [rs],
  );

  return (
    <Tooltip title={<RewardsTooltip rewards={rewards} />} arrow placement="bottom">
      <Button variant="outlined" onClick={open}>
        <Box display="flex" gap={0.5} alignItems="center">
          <AvatarGroup
            max={6}
            sx={{ '& .MuiAvatar-root': { width: 16, height: 16, fontSize: 10, borderColor: 'transparent' } }}
          >
            {rewards.map(({ symbol }) => (
              <Avatar key={symbol} alt={symbol} src={`/img/assets/${symbol}.svg`} />
            ))}
          </AvatarGroup>
          <Typography fontSize={14} fontWeight={700}>
            {totalAmount < WEI_PER_ETHER ? t('Rewards') : `$${formatNumber(formatEther(totalAmount), 'USD')}`}
          </Typography>
        </Box>
      </Button>
    </Tooltip>
  );
}

export default function ModalWrapper() {
  const { isOpen, close } = useModal('rewards');
  if (!isOpen) return null;
  return <RewardsModal isOpen={isOpen} close={close} />;
}
