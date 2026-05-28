import React, { memo, useCallback, useEffect, useState } from 'react';
import { erc20Abi } from 'viem';
import { useSendCalls, useWaitForCallsStatus } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { Allowance } from 'hooks/useAllowances';
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
  const { account: walletAddress } = useReadOnly();
  const { t } = useTranslation();
  const [callId, setCallId] = useState<string>();
  const { mutateAsync: sendCalls, isPending } = useSendCalls();
  const { data: callsStatus, isLoading } = useWaitForCallsStatus({
    id: callId,
    query: { enabled: Boolean(callId) },
  });

  useEffect(() => {
    if (callsStatus?.status === 'success') {
      update().finally(() => setCallId(undefined));
    } else if (callsStatus?.status === 'failure') {
      setCallId(undefined);
    }
  }, [callsStatus?.status, update]);

  const handleClick = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const { id } = await sendCalls({
        account: walletAddress,
        chainId: defaultChain.id,
        experimental_fallback: true,
        calls: [{ to: token, abi: erc20Abi, functionName: 'approve', args: [spenderAddress, 0n] }],
      });
      setCallId(id);
    } catch {
      // if request fails, don't do anything
    }
  }, [sendCalls, token, spenderAddress, walletAddress]);

  return (
    <MainActionButton variant="contained" loading={isPending || isLoading} fullWidth={fullWidth} onClick={handleClick}>
      {t('Revoke')}
    </MainActionButton>
  );
};

export default memo(RevokeButton);
