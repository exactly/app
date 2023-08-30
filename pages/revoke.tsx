import Allowances from 'components/Allowances';
import { usePageView } from 'hooks/useAnalytics';
import React, { memo } from 'react';

const Revoke = () => {
  usePageView('/revoke', 'Manage Allowances');
  return <Allowances />;
};

export default memo(Revoke);
