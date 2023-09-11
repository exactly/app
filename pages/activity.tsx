import React, { memo } from 'react';
import { Abi, getAddress } from 'viem';
import type { GetStaticProps } from 'next';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { readdir, readFile } from 'fs/promises';
import { basename } from 'path';
import { goerli, mainnet, optimism } from 'wagmi/chains';

import { defaultChain } from 'utils/client';
import Feed from 'components/RiskFeed/Feed';
import { usePageView } from 'hooks/useAnalytics';
import { Contracts } from 'components/RiskFeed/Decode';

type Props = {
  contracts: Contracts;
};

const multisig = {
  [optimism.id]: getAddress('0xC0d6Bc5d052d1e74523AD79dD5A954276c9286D3'),
  [mainnet.id]: getAddress('0x7A65824d74B0C20730B6eE4929ABcc41Cbe843Aa'),
}[defaultChain.id];

const Activity = ({ contracts }: Props) => {
  usePageView('/activity', 'Activity');
  const { t } = useTranslation();

  return (
    <Box my={4} maxWidth={800} mx="auto">
      <Box>
        <Typography
          component="h1"
          variant="h5"
          fontWeight={700}
          color={({ palette }) => (palette.mode === 'dark' ? 'white' : 'black')}
        >
          {t('Protocol Activity Monitor')}
        </Typography>
        <Typography mt={3} fontWeight={500} color="grey.900">
          {t(
            "We're dedicated to safeguarding your funds, and our Protocol Activity Monitor is key to achieving this goal. It provides real-time insights into the transactions and activities shaping our Protocol, empowering you to stay informed and enhancing your confidence and trust in our platform.",
          )}
        </Typography>
      </Box>
      <Box mt={6}>
        {multisig ? (
          <Feed contracts={contracts} multisig={multisig} />
        ) : (
          <Typography textAlign="center" fontWeight={700} color="grey.900">
            {t('There is no admin for this network')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ignore = ['.chainId', 'PriceFeed', 'Balancer', 'Uniswap', 'Socket'];

const networks = {
  [mainnet.id]: 'ethereum',
  [optimism.id]: optimism.network,
  [goerli.id]: goerli.network,
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const deployments = 'node_modules/@exactly/protocol/deployments';
  const id = Number(process.env.NEXT_PUBLIC_NETWORK);
  const network = networks[id as keyof typeof networks];

  if (!network) {
    throw new Error(`unknown network id: ${id}`);
  }

  const files = (await readdir(`${deployments}/${network}`)).filter(
    (name) => !name.includes('_') && !ignore.some((p) => name.startsWith(p)),
  );

  const parsed = await Promise.all(
    files.map(async (file) => {
      const buf = await readFile(`${deployments}/${network}/${file}`);
      const json = JSON.parse(buf.toString('utf-8'));
      return { [getAddress(json.address)]: { abi: json.abi as Abi, name: basename(file, '.json') } };
    }),
  );

  const contracts = parsed.reduce((acc, deploy) => ({ ...acc, ...deploy }), {});

  return { props: { contracts } };
};

export default memo(Activity);
