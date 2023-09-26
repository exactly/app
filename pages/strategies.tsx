import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Box, Button, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { usePageView } from 'hooks/useAnalytics';
import { useStartDebtManagerButton, useStartLeverager } from 'hooks/useActionButton';
import StrategyRowCard from 'components/strategies/StrategyRowCard';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';

const FeaturedStrategies = dynamic(() => import('components/strategies/FeaturedStrategies'));

const Strategies: NextPage = () => {
  usePageView('/strategies', 'Strategies');
  const { t } = useTranslation();
  const { query } = useRouter();
  const { startLeverager } = useStartLeverager();
  const { startDebtManager } = useStartDebtManagerButton();

  const exactlyStrategies = [
    {
      title: t('Maximize your yield'),
      description: t('Amplify gains or mitigate risk with the power of leverage and deleverage in your investments.'),
      tags: [
        { prefix: t('up to'), text: '48.16 APR' },
        { text: t('Advanced'), size: 'small' as const },
      ],
      button: (
        <Button fullWidth variant="contained" onClick={() => startLeverager()}>
          {t('Leverage')}
        </Button>
      ),
      isNew: true,
    },
    {
      title: t('Reduce Exposure'),
      description: t('Reduce your risk by decreasing your investment exposure and borrowing less.'),
      tags: [
        { prefix: t('Health Factor'), text: '2.010' },
        { text: t('Advanced'), size: 'small' as const },
      ],
      button: (
        <Button fullWidth variant="contained" onClick={() => startLeverager()}>
          {t('Deleverage')}
        </Button>
      ),
      isNew: true,
    },
    {
      title: t('Refinance Loans'),
      description: t(
        'Seamlessly transfer your debt positions between different pools or convert from fixed to variable rates, and vice versa.',
      ),
      tags: [
        { prefix: t('FROM'), text: '1.83% APR' },
        { text: t('Basic'), size: 'small' as const },
      ],
      button: (
        <Button fullWidth variant="contained" onClick={() => startDebtManager({})}>
          {t('Rollover')}
        </Button>
      ),
      isNew: true,
    },
  ];

  const thirdPartStrategies = [
    {
      title: t('Deposit EXA on Extra Finance'),
      description: t('Deposit EXA on Extra Finance and earn interest on it.'),
      tags: [
        { prefix: t('up to'), text: '48.16 APR' },
        { text: t('Basic'), size: 'small' as const },
      ],
      button: (
        <a href="https://app.extrafi.io/lend/EXA" target="_blank" rel="noreferrer noopener" style={{ width: '100%' }}>
          <Button fullWidth variant="contained">
            {t('Go to Extra Finance')}
          </Button>
        </a>
      ),
      imgPath: '/img/assets/EXTRA.svg',
    },
    {
      title: t('Provide Liquidity on Velodrome'),
      description: t('Provide liquidity to the EXA/wETH pool.'),
      tags: [
        { prefix: t('up to'), text: '48.16 APR' },
        { text: t('Basic'), size: 'small' as const },
      ],
      button: (
        <a
          href="https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth"
          target="_blank"
          rel="noreferrer noopener"
          style={{ width: '100%' }}
        >
          <Button fullWidth variant="contained">
            {t('Go to Velodrome')}
          </Button>
        </a>
      ),
      imgPath: '/img/assets/VELO.svg',
    },
    {
      title: t('Bridge & Swap with Socket'),
      description: t('Seamlessly bridge and swap assets to OP Mainnet from many different networks.'),
      tags: [{ text: t('Cross Network') }, { text: t('Basic'), size: 'small' as const }],
      button: (
        <Link href={{ pathname: `/bridge`, query }} style={{ width: '100%' }}>
          <Button fullWidth variant="contained">
            {t('Bridge & Swap')}
          </Button>
        </Link>
      ),
      imgPath: '/img/strategies/socket-logo.svg',
    },
  ];

  return (
    <Box my={5} maxWidth={1200} mx="auto">
      <Box display="flex" flexDirection="column" gap={5}>
        <Typography component="h1" fontSize={24} fontWeight={700}>
          {t('Featured Strategies')}
        </Typography>
        <FeaturedStrategies />
      </Box>
      <Box mt={10} display="flex" flexDirection="column" gap={6}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography component="h1" fontSize={24} fontWeight={700}>
            {t('All Strategies')}
          </Typography>
          <Typography>
            {t('Take control of your investments with strategies that balance risk and reward for long-term success.')}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography component="h2" variant="h6">
            {t('Exactly Powered')}
          </Typography>
          <Box
            bgcolor="components.bg"
            borderRadius="8px"
            boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
          >
            {exactlyStrategies.map((strategy, i) => (
              <>
                <StrategyRowCard key={strategy.title} {...strategy} />
                {i !== exactlyStrategies.length - 1 && <Divider key={`divider_${i}`} flexItem />}
              </>
            ))}
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography component="h2" variant="h6">
            {t('Third-Party Powered')}
          </Typography>
          <Typography>
            {t(
              'Please be aware that these are third-party offerings. Exercise caution and do your due diligence to secure your funds.',
            )}
          </Typography>
          <Box
            bgcolor="components.bg"
            borderRadius="8px"
            boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
          >
            {thirdPartStrategies.map((strategy, i) => (
              <>
                <StrategyRowCard key={strategy.title} {...strategy} />
                {i !== exactlyStrategies.length - 1 && <Divider key={`divider_${i}`} flexItem />}
              </>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Strategies;
