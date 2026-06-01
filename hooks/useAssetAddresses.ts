import { useMemo } from 'react';
import usePreviewerExactly from './usePreviewerExactly';

export default (): string[] => {
  const { data: accountData } = usePreviewerExactly();

  return useMemo<string[]>(() => accountData?.map((m) => m.asset.toLowerCase()) ?? [], [accountData]);
};
