import React, { memo, useMemo } from 'react';

import { useGetEXA } from 'contexts/GetEXAContext';
import { Avatar, Box, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ETH } from 'hooks/useSocketAssets';
import { defaultChain } from 'utils/client';

const ChainAsset = ({ symbol, icon, chainId }: { symbol: string; icon?: string; chainId: number }) => {
  const { chains } = useGetEXA();

  const chain = useMemo(() => chains?.find((c) => c.chainId === chainId), [chainId, chains]);
  const { t } = useTranslation();

  return (
    <Tooltip title={`${symbol} ${t('in')} ${chain?.name ?? defaultChain.name}`} placement="top" arrow>
      <Box display="flex" position="relative">
        <Avatar sx={{ width: 24, height: 24 }} src={symbol === 'ETH' ? ETH.icon : icon} alt={symbol} />
        <Avatar
          sx={{ width: '14px', height: '14px', position: 'absolute', top: -4, right: -4 }}
          src={chain?.icon ?? `/img/networks/${defaultChain.id}.svg`}
          alt={chain?.name ?? defaultChain.name}
        />
      </Box>
    </Tooltip>
  );
};

const Protocol = ({ icon, displayName }: { icon?: string; displayName?: string }) => (
  <Tooltip title={displayName} placement="top" arrow>
    <Avatar sx={{ width: 24, height: 24 }} imgProps={{ style: { objectFit: 'contain' } }} src={icon} />
  </Tooltip>
);

const RouteSteps = () => {
  const { route, asset, chain: sourceChain } = useGetEXA();
  if (!route) return null;

  const [{ steps }] = route.userTxs;

  const displaySteps = [
    asset ? <ChainAsset {...{ ...asset, chainId: sourceChain?.chainId ?? defaultChain.id }} /> : undefined,
    ...(steps?.flatMap((step) => [
      <Protocol key={step.protocol.displayName} {...step?.protocol} />,
      <ChainAsset key={step.toAsset.address} {...step.toAsset} />,
    ]) ||
      route.userTxs.flatMap((tx) => [
        <Protocol key={tx.protocol?.displayName} {...tx?.protocol} />,
        <ChainAsset key={tx.toAsset.address} {...tx.toAsset} />,
      ])),
    <Protocol displayName="Velodrome" key="velo" icon="https://velodrome.finance/velodrome.svg" />,
    <ChainAsset key={'exa'} chainId={defaultChain.id} icon={'/img/assets/EXA.svg'} symbol={'EXA'} />,
  ];

  return (
    <Box display="flex" alignItems="center" gap={1} data-testid="get-exa-route">
      {displaySteps.map((step, index) => (
        <>
          {index !== 0 && (
            <Typography color="grey.500" key={index}>
              {' -> '}
            </Typography>
          )}
          {step}
        </>
      ))}
    </Box>
  );
};

export default memo(RouteSteps);
