import React from 'react';

import { staticAssets } from 'utils/assets';
import AssetPage from 'components/asset/Page';

export const dynamicParams = false;

export const generateStaticParams = async () => {
  const assets = await staticAssets();
  return assets.map((asset) => ({ symbol: asset }));
};

const Market = ({ params }: { params: { symbol: string } }) => {
  const { symbol } = params;

  return <AssetPage symbol={symbol} />;
};

export default Market;
