import React, { memo, useCallback, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { waitForTransaction } from '@wagmi/core';
import { useTranslation } from 'react-i18next';
import { Allowance } from 'hooks/useAllowances';
import { useWeb3 } from 'hooks/useWeb3';
import useERC20 from 'hooks/useERC20';

const RevokeButton = ({
  token,
  spenderAddress,
  fullWidth,
  update,
}: Pick<Allowance, 'token' | 'spenderAddress'> & {
  update: () => Promise<void>;
  fullWidth?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const erc20 = useERC20(token);
  const { opts, chain } = useWeb3();
  const { t } = useTranslation();
  const { chain: walletChain } = useNetwork();
  const { switchNetwork, isLoading: switchIsLoading } = useSwitchNetwork();

  const handleClick = useCallback(async () => {
    if (!erc20 || !opts) return;
    setLoading(true);
    try {
      const tx = await erc20.write.approve([spenderAddress, 0n], opts);
      await waitForTransaction({ hash: tx });
      update();
    } catch {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
    }
  }, [erc20, opts, spenderAddress, update]);

  if (chain && chain.id !== walletChain?.id) {
    return (
      <LoadingButton fullWidth onClick={() => switchNetwork?.(chain.id)} variant="contained" loading={switchIsLoading}>
        {t('Please switch to {{network}} network', { network: chain.name })}
      </LoadingButton>
    );
  }
  return (
    <LoadingButton variant="contained" loading={loading} fullWidth={fullWidth} onClick={handleClick}>
      {t('Revoke')}
    </LoadingButton>
  );
};

export default memo(RevokeButton);
