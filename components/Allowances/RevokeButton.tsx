import React, { memo, useCallback, useState } from 'react';
import waitForTransaction from 'utils/waitForTransaction';
import { useTranslation } from 'react-i18next';
import { Allowance } from 'hooks/useAllowances';
import useERC20 from 'hooks/useERC20';
import MainActionButton from 'components/common/MainActionButton';
import useReadOnly from 'hooks/useReadOnly';
import { defaultChain } from 'utils/client';

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
  const { account: walletAddress } = useReadOnly();
  const { t } = useTranslation();

  const handleClick = useCallback(async () => {
    if (!erc20 || !walletAddress) return;
    setLoading(true);
    try {
      const tx = await erc20.write.approve([spenderAddress, 0n], { account: walletAddress, chain: defaultChain });
      await waitForTransaction({ hash: tx });
      update();
    } catch {
      // if request fails, don't do anything
    } finally {
      setLoading(false);
    }
  }, [erc20, spenderAddress, update, walletAddress]);

  return (
    <MainActionButton variant="contained" loading={loading} fullWidth={fullWidth} onClick={handleClick}>
      {t('Revoke')}
    </MainActionButton>
  );
};

export default memo(RevokeButton);
