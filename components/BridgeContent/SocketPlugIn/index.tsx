import React, { memo, useCallback, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';
import { useNetwork } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import { Network, transactionDetails } from '@socket.tech/plugin';
import useEthersProvider from 'hooks/useEthersProvider';
import { optimism } from 'viem/chains';
import { tokens } from './tokens.json';
import useAnalytics from 'hooks/useAnalytics';
import { hexToRgb } from './utils';
import useAssets from 'hooks/useAssets';

const DynamicBridge = dynamic(() => import('@socket.tech/plugin').then((mod) => mod.Bridge), {
  ssr: false,
});

type Props = {
  updateRutes: () => void;
};

const SocketPlugIn = ({ updateRutes }: Props) => {
  const { chain } = useNetwork();
  const { palette } = useTheme();
  const { t } = useTranslation();
  const provider = useEthersProvider();
  const { transaction } = useAnalytics();
  const [destinationNetwork, setDestinationNetwork] = useState<Network | undefined>();
  const [sourceNetwork, setSourceNetwork] = useState<Network | undefined>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const assets = useAssets();

  const tokenList = useMemo(
    () =>
      tokens
        .filter(({ chainId, symbol }) => {
          const isBridgeToOPMainnet =
            destinationNetwork?.chainId === optimism.id && sourceNetwork?.chainId !== optimism.id;
          const isSourceToken = chainId === sourceNetwork?.chainId;

          return isBridgeToOPMainnet
            ? isSourceToken || assets.includes(symbol)
            : isSourceToken || chainId === destinationNetwork?.chainId;
        })
        .sort((t1, t2) => (assets.includes(t1.symbol) && !assets.includes(t2.symbol) ? -1 : 1)),
    [assets, destinationNetwork?.chainId, sourceNetwork?.chainId],
  );

  const handleSourceNetworkChange = useCallback(setSourceNetwork, [setSourceNetwork]);

  const handleDestinationNetworkChange = useCallback(setDestinationNetwork, [setDestinationNetwork]);

  const handleSubmit = useCallback(
    ({ sourceToken, destinationToken, sourceAmount, destinationAmount }: transactionDetails) => {
      updateRutes();
      const bridgeInput = {
        sourceChainId: sourceNetwork?.chainId,
        sourceToken: sourceToken.symbol,
        destinationChainId: destinationNetwork?.chainId,
        destinationToken: destinationToken.symbol,
        sourceAmount,
        destinationAmount,
      };
      transaction.addToCart('bridge', bridgeInput);
    },
    [destinationNetwork?.chainId, updateRutes, sourceNetwork?.chainId, transaction],
  );

  const handleSuccess = useCallback(
    ({ sourceToken, destinationToken, sourceAmount, destinationAmount }: transactionDetails) => {
      updateRutes();
      const bridgeInput = {
        sourceChainId: sourceNetwork?.chainId,
        sourceToken: sourceToken.symbol,
        destinationChainId: destinationNetwork?.chainId,
        destinationToken: destinationToken.symbol,
        sourceAmount,
        destinationAmount,
      };

      transaction.purchase('bridge', bridgeInput);
    },
    [destinationNetwork?.chainId, updateRutes, sourceNetwork?.chainId, transaction],
  );

  return (
    <Box borderRadius={'8px'} display={'flex'} justifyContent={'center'} boxShadow={'0px 3px 4px 0px #61666B1A'}>
      <DynamicBridge
        provider={provider}
        enableSameChainSwaps
        API_KEY={process.env.NEXT_PUBLIC_SOCKET_API_KEY || ''}
        defaultSourceNetwork={chain?.id || 10}
        destNetworks={[optimism.id]}
        defaultDestNetwork={optimism.id}
        customize={{
          primary: hexToRgb(palette.components.bg),
          secondary: hexToRgb(palette.components.bg),
          text: hexToRgb(palette.text.primary),
          secondaryText: hexToRgb(palette.text.primary),
          interactive: hexToRgb(palette.components.bg),
          outline: hexToRgb(palette.text.primary),
          accent: hexToRgb(palette.text.primary),
          onInteractive: hexToRgb(palette.text.primary),
          onAccent: hexToRgb(palette.components.bg),
          width: isMobile ? 348 : 448,
          borderRadius: 0.5,
        }}
        title={t('Select network and assets')}
        onSubmit={handleSubmit}
        onBridgeSuccess={handleSuccess}
        onSourceNetworkChange={handleSourceNetworkChange}
        onDestinationNetworkChange={handleDestinationNetworkChange}
        tokenList={tokenList}
      />
    </Box>
  );
};

export default memo(SocketPlugIn);
