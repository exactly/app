import { useMemo } from 'react';

import { HealthFactor } from 'types/HealthFactor';
import getHealthFactorData from 'utils/getHealthFactorData';
import useAccountData from './useAccountData';

export default function useHealthFactor(): HealthFactor | undefined {
  const { accountData } = useAccountData();
  return useMemo(() => {
    if (!accountData) return;
    return getHealthFactorData(accountData);
  }, [accountData]);
}
