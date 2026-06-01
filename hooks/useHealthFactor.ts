import { useMemo } from 'react';

import { HealthFactor } from 'types/HealthFactor';
import getHealthFactorData from 'utils/getHealthFactorData';
import usePreviewerExactly from './usePreviewerExactly';

export default function useHealthFactor(): HealthFactor | undefined {
  const { data: accountData } = usePreviewerExactly();
  return useMemo(() => {
    if (!accountData) return;
    return getHealthFactorData(accountData);
  }, [accountData]);
}
