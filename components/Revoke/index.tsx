import React from 'react';
import { Box, Dialog, DialogContent, DialogTitle, Typography, useMediaQuery, useTheme } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import useAccountData, { MarketAccount } from 'hooks/useAccountData';
import useDebtManager from 'hooks/useDebtManager';
import { useWeb3 } from 'hooks/useWeb3';
import { Address } from 'viem';
import { useMarketAllowance, useMarketApprove, usePrepareMarketApprove } from 'types/abi';
import { useWaitForTransaction } from 'wagmi';

import MarketUSDC from '@exactly/protocol/deployments/optimism/MarketUSDC.json' assert { type: 'json' };
import MarketWETH from '@exactly/protocol/deployments/optimism/MarketWETH.json' assert { type: 'json' };
import MarketwstETH from '@exactly/protocol/deployments/optimism/MarketwstETH.json' assert { type: 'json' };
import MarketOP from '@exactly/protocol/deployments/optimism/MarketOP.json' assert { type: 'json' };

type PropsRevoke = {
  market: Address;
  spender: Address;
  account: Address;
  symbol: string;
  refetch: () => void;
};

function RevokeApprove({ market, spender, account, symbol, refetch }: PropsRevoke) {
  const { chain } = useWeb3();
  const { config } = usePrepareMarketApprove({ address: market, args: [spender, 0n], account, chainId: chain.id });
  const { write, data, isLoading: isLoadingWrite } = useMarketApprove(config);

  const { isLoading } = useWaitForTransaction({ hash: data?.hash, onSettled: () => refetch() });

  return (
    <LoadingButton
      variant="contained"
      onClick={write}
      disabled={isLoadingWrite || isLoading}
      loading={isLoadingWrite || isLoading}
    >
      Revoke {symbol}
    </LoadingButton>
  );
}

type PropsModal = {
  getMarketAccount: (s: string) => MarketAccount | undefined;
  debtManager: NonNullable<ReturnType<typeof useDebtManager>>;
  walletAddress: Address;
};

function RevokeModal({ getMarketAccount, debtManager, walletAddress }: PropsModal) {
  const { breakpoints, spacing } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const exaUSDC = getMarketAccount('USDC')?.market ?? (MarketUSDC.address as Address);
  const exaWETH = getMarketAccount('WETH')?.market ?? (MarketWETH.address as Address);
  const exawstETH = getMarketAccount('wstETH')?.market ?? (MarketwstETH.address as Address);
  const exaOP = getMarketAccount('OP')?.market ?? (MarketOP.address as Address);

  const { data: allowanceUSDC, refetch: refetchUSDC } = useMarketAllowance({
    address: exaUSDC,
    args: [walletAddress, debtManager.address],
  });
  const { data: allowanceWETH, refetch: refetchWETH } = useMarketAllowance({
    address: exaWETH,
    args: [walletAddress, debtManager.address],
  });
  const { data: allowanceWSTETH, refetch: refetchWSTETH } = useMarketAllowance({
    address: exawstETH,
    args: [walletAddress, debtManager.address],
  });
  const { data: allowanceOP, refetch: refetchOP } = useMarketAllowance({
    address: exaOP,
    args: [walletAddress, debtManager.address],
  });

  const open =
    (allowanceUSDC || 0n) > 0n ||
    (allowanceWETH || 0n) > 0n ||
    (allowanceWSTETH || 0n) > 0n ||
    (allowanceOP || 0n) > 0n;

  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: '375px',
          maxWidth: '488px !important',
          width: '100%',
          overflowY: 'hidden !important',
        },
      }}
      fullScreen={isMobile}
      sx={{ backdropFilter: 'blur(1.5px)' }}
      disableEscapeKeyDown
    >
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          overflowY: 'auto',
        }}
      >
        <DialogTitle
          sx={{
            p: 0,
            mb: { xs: 2, sm: 3 },
            cursor: { xs: '', sm: 'move' },
          }}
        >
          <Typography color="red" fontWeight={700} fontSize={24}>
            Revoke allowance
          </Typography>
          <Typography fontWeight={500} fontSize={16}>
            You need to revoke access on these markets contracts.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box>
            {exaUSDC && (allowanceUSDC || 0n) > 0n ? (
              <RevokeApprove
                symbol={'exaUSDC'}
                market={exaUSDC}
                spender={debtManager.address}
                refetch={refetchUSDC}
                account={walletAddress}
              />
            ) : null}
          </Box>
          <Box>
            {exaWETH && (allowanceWETH || 0n) > 0n ? (
              <RevokeApprove
                symbol={'exaWETH'}
                market={exaWETH}
                spender={debtManager.address}
                refetch={refetchWETH}
                account={walletAddress}
              />
            ) : null}
          </Box>
          <Box>
            {exawstETH && (allowanceWSTETH || 0n) > 0n ? (
              <RevokeApprove
                symbol={'exawstETH'}
                market={exawstETH}
                spender={debtManager.address}
                refetch={refetchWSTETH}
                account={walletAddress}
              />
            ) : null}
          </Box>
          <Box>
            {exaOP && (allowanceOP || 0n) > 0n ? (
              <RevokeApprove
                symbol={'exaOP'}
                market={exaOP}
                spender={debtManager.address}
                refetch={refetchOP}
                account={walletAddress}
              />
            ) : null}
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
}

export default function Revoke() {
  const { walletAddress, impersonateActive } = useWeb3();
  const { getMarketAccount } = useAccountData();
  const debtManager = useDebtManager();

  if (!getMarketAccount || !debtManager || !walletAddress || impersonateActive) return null;

  return <RevokeModal getMarketAccount={getMarketAccount} debtManager={debtManager} walletAddress={walletAddress} />;
}
