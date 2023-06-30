import React, { memo } from 'react';

import BridgeContent from 'components/BridgeContent';
import { usePageView } from 'hooks/useAnalytics';

const Bridge = () => {
  usePageView('/bridge', 'Bridge');
  return <BridgeContent />;
};

export default memo(Bridge);
