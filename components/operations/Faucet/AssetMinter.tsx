import React, { useCallback, useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { LoadingButton } from '@mui/lab';
import useAccountData from 'hooks/useAccountData';
import { erc20ABI } from 'types/abi';
import { useWeb3 } from 'hooks/useWeb3';
import { parseUnits } from 'viem';
import { t } from 'i18next';

type Props = {
  symbol: string;
};

const AssetMinter = ({ symbol }: Props) => {
  const { getMarketAccount, refreshAccountData } = useAccountData();

  const marketAccount = getMarketAccount(symbol);
  const { walletAddress } = useWeb3();
  const [loading, setLoading] = useState<string | undefined>(undefined);

  const { data, write } = useContractWrite({
    address: marketAccount?.asset,
    abi: erc20ABI,
    functionName: 'mint',
  });

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSettled: async () => {
      await refreshAccountData();
      setLoading(undefined);
    },
  });

  const mint = useCallback(
    (s: string) => {
      if (!marketAccount || !walletAddress) return;
      try {
        const { decimals } = marketAccount;

        setLoading(s);
        const amounts: Record<string, string> = {
          DAI: '10000',
          USDC: '10000',
          WBTC: '2',
          OP: '1000',
          'USDC.e': '10000',
          wstETH: '10',
        };

        write({ args: [walletAddress, parseUnits(amounts[symbol], decimals)] });
      } catch (e) {
        setLoading(undefined);
      }
    },
    [marketAccount, symbol, walletAddress, write],
  );

  return (
    <LoadingButton variant="contained" onClick={() => mint(symbol)} loading={isLoading && symbol === loading}>
      {t('Mint')}
    </LoadingButton>
  );
};

export default AssetMinter;
