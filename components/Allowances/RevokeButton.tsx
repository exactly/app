import React, { memo, useCallback, useState } from 'react';
import waitForTransaction from 'utils/waitForTransaction';
import { useTranslation } from 'react-i18next';
import { Allowance } from 'hooks/useAllowances';
import { useWeb3 } from 'hooks/useWeb3';
import useERC20 from 'hooks/useERC20';
import MainActionButton from 'components/common/MainActionButton';

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
  const { opts } = useWeb3();
  const { t } = useTranslation();

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

  return (
    <MainActionButton variant="contained" loading={loading} fullWidth={fullWidth} mainAction={handleClick}>
      {t('Revoke')}
    </MainActionButton>
  );
};

export default memo(RevokeButton);
