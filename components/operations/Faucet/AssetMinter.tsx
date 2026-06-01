import React, { useCallback, useEffect, useState } from 'react';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { LoadingButton } from '@mui/lab';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import { erc20Abi } from 'generated/wagmi';
import { parseUnits } from 'viem';
import { t } from 'i18next';
import useReadOnly from 'hooks/useReadOnly';

type Props = {
  symbol: string;
};

const AssetMinter = ({ symbol }: Props) => {
  const { data: accountData, refetch } = usePreviewerExactly();

  const marketAccount = accountData?.find((market) => market.assetSymbol === symbol);
  const { account: walletAddress } = useReadOnly();
  const [loading, setLoading] = useState<string | undefined>(undefined);

  const { data, mutate: writeContract } = useWriteContract();

  const {
    data: receipt,
    error: receiptError,
    isLoading,
  } = useWaitForTransactionReceipt({
    hash: data,
    query: {
      enabled: Boolean(data),
    },
  });

  useEffect(() => {
    if (!receipt && !receiptError) return;
    void refetch();
    setLoading(undefined);
  }, [receipt, receiptError, refetch]);

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

        writeContract({
          address: marketAccount.asset,
          abi: erc20Abi,
          functionName: 'mint',
          args: [walletAddress, parseUnits(amounts[symbol], decimals)],
        });
      } catch (e) {
        setLoading(undefined);
      }
    },
    [marketAccount, symbol, walletAddress, writeContract],
  );

  return (
    <LoadingButton variant="contained" onClick={() => mint(symbol)} loading={isLoading && symbol === loading}>
      {t('Mint')}
    </LoadingButton>
  );
};

export default AssetMinter;
