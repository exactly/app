import React, { memo } from 'react';
import { Abi, getAddress } from 'viem';
import type { GetStaticProps } from 'next';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { readdir, readFile } from 'fs/promises';

import Feed from 'components/RiskFeed/Feed';
import { usePageView } from 'hooks/useAnalytics';
import { goerli, mainnet, optimism } from 'wagmi/chains';
import { Contracts } from 'components/RiskFeed/Decode';
import { basename } from 'path';

type Props = {
  contracts: Contracts;
};

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
        <Feed contracts={contracts} />
      </Box>
    </Box>
  );
};

const ignore = ['.chainId', 'PriceFeed', 'Balancer', 'Uniswap', 'Socket'];

const networks = {
  [mainnet.id]: 'mainnet',
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
