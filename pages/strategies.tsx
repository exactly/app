import React, { useMemo, Fragment } from 'react';
import type { NextPage } from 'next';
import { Box, Button, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { optimismSepolia, optimism } from 'wagmi/chains';
import MAX_UINT256 from '@exactly/lib/esm/fixed-point-math/MAX_UINT256';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import { useStartDebtManagerButton, useStartLeverager } from 'hooks/useActionButton';
import StrategyRowCard from 'components/strategies/StrategyRowCard';
import useRouter from 'hooks/useRouter';
import useHealthFactor from 'hooks/useHealthFactor';
import parseHealthFactor from 'utils/parseHealthFactor';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { type Props as Strategy } from 'components/strategies/StrategyCard';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import useRewards from 'hooks/useRewards';
import { parseEther } from 'viem';
import { useVELOPoolAPR } from 'hooks/useVELO';
import { useExtraDepositAPR } from 'hooks/useExtra';
import { useWeb3 } from 'hooks/useWeb3';
import FeaturedStrategies from 'components/strategies/FeaturedStrategies';
import { useModal } from '../contexts/ModalContext';
import { track } from 'utils/mixpanel';

const Strategies: NextPage = () => {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { startLeverager } = useStartLeverager();
  const { startDebtManager } = useStartDebtManagerButton();
  const { open: openGetEXA } = useModal('exa');

  const { chain } = useWeb3();

  const hf = useHealthFactor();
  const hfLabel = parseHealthFactor(hf?.debt ?? 0n, hf?.collateral ?? 0n);

  const { accountData, getMarketAccount } = useAccountData();
  const lowestBorrowAPR = useMemo(() => {
    if (!accountData) return undefined;
    const lowestAPR = accountData.reduce((apr, marketAccount) => {
      const lowest = marketAccount.floatingBorrowRate < apr ? marketAccount.floatingBorrowRate : apr;
      return marketAccount.fixedPools.reduce((current, pool) => {
        return pool.minBorrowRate < current ? pool.minBorrowRate : current;
      }, lowest);
    }, MAX_UINT256);
    return toPercentage(Number(lowestAPR) / 1e18);
  }, [accountData]);

  const { depositAPR: usdcDepositAPR } = useFloatingPoolAPR('USDC', undefined, 'deposit');

  const { rates } = useRewards();

  const maxYield = useMemo(() => {
    const usdc = getMarketAccount('USDC');
    if (!usdc || !usdcDepositAPR) return '0%';
    const ratio = (WAD * WAD) / (WAD - (usdc.adjustFactor * usdc.adjustFactor) / WAD);

    const marketAPR =
      (parseEther(String(usdcDepositAPR)) * ratio) / WAD - (usdc.floatingBorrowRate * (ratio - WAD)) / WAD;

    const collateralRewardsAPR =
      rates['USDC']?.map((r) => (r.floatingDeposit * ratio) / WAD).reduce((acc, curr) => acc + curr, 0n) ?? 0n;

    const borrowRewardsAPR =
      rates['USDC']?.map((r) => (r.borrow * (ratio - WAD)) / WAD).reduce((acc, curr) => acc + curr, 0n) ?? 0n;

    return toPercentage(Number(marketAPR + collateralRewardsAPR + borrowRewardsAPR) / 1e18);
  }, [getMarketAccount, rates, usdcDepositAPR]);

  const veloRate = useVELOPoolAPR() ?? '0%';
  const extraRate = useExtraDepositAPR();

  const featured: (Strategy & { chainId?: number })[] = useMemo(
    () =>
      [
        {
          title: t('esEXA Vesting'),
          description: t('Unlock your EXA rewards for being an active participant in the Protocol'),
          tags: [
            { prefix: t('EARN'), text: 'EXA' },
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <Link href={{ pathname: '/vesting', query }} style={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  track('Button Clicked', {
                    location: 'Strategies',
                    name: 'vest',
                    href: '/vesting',
                    isNew: false,
                  })
                }
              >
                {t('Vest esEXA')}
              </Button>
            </Link>
          ),
          source: 'exactly' as const,
          isNew: false,
          imgPath: '/img/strategies/featured_esEXA.svg',
          chainId: optimism.id,
        },
        {
          title: t('Debit to Credit'),
          description: t(
            'Easily turn your current crypto-funded debit card into a credit card by getting a USDC borrow at a fixed rate.',
          ),
          tags: [{ text: t('Advanced'), size: 'small' as const }],
          button: (
            <Link href={{ pathname: '/debit2credit' }} style={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  track('Button Clicked', {
                    location: 'Strategies',
                    name: 'debit to credit',
                    href: '/debit2credit',
                    isNew: false,
                  })
                }
              >
                {t('Get Started')}
              </Button>
            </Link>
          ),
          isNew: false,
          source: 'exactly' as const,
          imgPath: '/img/strategies/featured_debit2credit.svg',
          chainId: optimism.id,
        },
        {
          title: t('Maximize your yield'),
          description: t(
            'Amplify gains or mitigate risk with the power of leverage and deleverage in your investments.',
          ),
          tags: [
            { prefix: t('up to'), text: `${maxYield} APR` },
            { text: t('Advanced'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                startLeverager();
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'leverage',
                  isNew: false,
                });
              }}
              data-testid="leverage"
            >
              {t('Leverage')}
            </Button>
          ),
          source: 'exactly' as const,
          imgPath: '/img/strategies/featured_leverage.svg',
        },
        {
          title: t('Refinance Loans'),
          description: t(
            'Seamlessly transfer your debt positions between different pools or convert from fixed to variable rates, and vice versa.',
          ),
          tags: [
            { prefix: t('FROM'), text: `${lowestBorrowAPR} APR` },
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                startDebtManager({});
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'rollover',
                  isNew: false,
                });
              }}
              data-testid="rollover"
            >
              {t('Rollover')}
            </Button>
          ),
          source: 'exactly' as const,
          imgPath: '/img/strategies/featured_rollover.svg',
        },
        {
          title: t('Reduce Exposure'),
          description: t('Reduce your risk by decreasing your investment exposure and borrowing less.'),
          tags: [
            { prefix: t('Health Factor'), text: hfLabel },
            { text: t('Advanced'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                startLeverager();
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'deleverage',
                  isNew: false,
                });
              }}
            >
              {t('Deleverage')}
            </Button>
          ),
          isNew: false,
          source: 'exactly' as const,
          imgPath: '/img/strategies/featured_leverage.svg',
        },
      ]
        .filter((s) => s.chainId === chain.id || s.chainId === undefined)
        .slice(0, 3),
    [chain.id, hfLabel, lowestBorrowAPR, maxYield, query, startDebtManager, startLeverager, t],
  );

  const exactlyStrategies = useMemo(
    () =>
      [
        {
          title: t('Debit to Credit'),
          description: t(
            'Easily turn your current crypto-funded debit card into a credit card by getting a USDC borrow at a fixed rate.',
          ),
          tags: [{ text: t('Advanced'), size: 'small' as const }],
          button: (
            <Link href={{ pathname: '/debit2credit' }} style={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  track('Button Clicked', {
                    location: 'Strategies',
                    name: 'debit to credit',
                    isNew: false,
                    href: '/debit2credit',
                  });
                }}
              >
                {t('Get Started')}
              </Button>
            </Link>
          ),
          isNew: false,
          chainId: optimism.id,
          visibleChainId: [optimism.id] as number[],
        },
        {
          title: 'esEXA',
          description: t('Unlock your EXA rewards for being an active participant in the Protocol'),
          tags: [
            { prefix: t('EARN'), text: 'EXA' },
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <Link href={{ pathname: '/vesting', query }} style={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  track('Button Clicked', {
                    location: 'Strategies',
                    name: 'vest',
                    isNew: false,
                    href: '/vesting',
                  });
                }}
              >
                {t('Vest esEXA')}
              </Button>
            </Link>
          ),
          isNew: false,
          visibleChainId: [optimism.id, optimismSepolia.id] as number[],
        },
        {
          title: t('Get EXA'),
          description: t(
            "Ready to take part in the Protocol's Governance, Vesting Program, or simply hold EXA? Begin by getting EXA today.",
          ),
          tags: [
            { prefix: t('GET'), text: 'EXA' },
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                openGetEXA();
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'get exa',
                  isNew: false,
                });
              }}
            >
              {t('Get EXA')}
            </Button>
          ),
          chainId: optimism.id,
          visibleChainId: [optimism.id, optimismSepolia.id] as number[],
        },
        {
          title: t('Maximize your yield'),
          description: t(
            'Amplify gains or mitigate risk with the power of leverage and deleverage in your investments.',
          ),
          tags: [
            { prefix: t('up to'), text: `${maxYield} APR` },
            { text: t('Advanced'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                startLeverager();
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'leverage',
                  isNew: false,
                });
              }}
            >
              {t('Leverage')}
            </Button>
          ),
        },
        {
          title: t('Reduce Exposure'),
          description: t('Reduce your risk by decreasing your investment exposure and borrowing less.'),
          tags: [
            { prefix: t('Health Factor'), text: hfLabel },
            { text: t('Advanced'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                startLeverager();
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'deleverage',
                  isNew: false,
                });
              }}
            >
              {t('Deleverage')}
            </Button>
          ),
        },
        {
          title: t('Refinance Loans'),
          description: t(
            'Seamlessly transfer your debt positions between different pools or convert from fixed to variable rates, and vice versa.',
          ),
          tags: [
            { prefix: t('FROM'), text: `${lowestBorrowAPR} APR` },
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                startDebtManager({});
                track('Button Clicked', {
                  location: 'Strategies',
                  name: 'rollover',
                  isNew: false,
                });
              }}
            >
              {t('Rollover')}
            </Button>
          ),
        },
      ].filter((s) => s.visibleChainId === undefined || s.visibleChainId.includes(chain.id)),
    [chain.id, hfLabel, lowestBorrowAPR, maxYield, openGetEXA, query, startDebtManager, startLeverager, t],
  );

  const thirdPartyStrategies: (Strategy & { chainId?: number })[] = useMemo(
    () =>
      [
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
        {
          chainId: optimism.id,
          title: t('Provide Liquidity on Velodrome'),
          description: t('Provide liquidity to the EXA/wETH pool.'),
          tags: [
            { prefix: t('up to'), text: `${veloRate} APR` },
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <a
              href="https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth"
              target="_blank"
              rel="noreferrer noopener"
              style={{ width: '100%' }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  track('Button Clicked', {
                    location: 'Strategies',
                    name: 'velodrome',
                    isNew: false,
                    href: 'https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth',
                  })
                }
              >
                {t('Go to Velodrome')}
              </Button>
            </a>
          ),
          imgPath: '/img/assets/VELO.svg',
        },

        {
          chainId: optimism.id,
          title: t('Deposit EXA on Extra Finance'),
          description: t('Deposit EXA on Extra Finance and earn interest on it.'),
          tags: [
            ...(extraRate && extraRate > 10n ** 18n
              ? [{ prefix: t('up to'), text: `${toPercentage(Number(extraRate ?? 0) / 1e18)} APR` }]
              : []),
            { text: t('Basic'), size: 'small' as const },
          ],
          button: (
            <a
              href="https://app.extrafi.io/lend/EXA"
              target="_blank"
              rel="noreferrer noopener"
              style={{ width: '100%' }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  track('Button Clicked', {
                    location: 'Strategies',
                    name: 'extra finance',
                    isNew: false,
                    href: 'https://app.extrafi.io/lend/EXA',
                  })
                }
              >
                {t('Go to Extra Finance')}
              </Button>
            </a>
          ),
          imgPath: '/img/assets/EXTRA.svg',
        },
      ].filter((s) => s.chainId === chain.id || s.chainId === undefined),
    [chain.id, extraRate, query, t, veloRate],
  );

  return (
    <Box my={5} maxWidth={1200} mx="auto">
      <Box display="flex" flexDirection="column" gap={5}>
        <Typography component="h1" fontSize={24} fontWeight={700}>
          {t('Featured Strategies')}
        </Typography>
        <FeaturedStrategies featured={featured} />
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
            {t('Exactly Protocol Powered')}
          </Typography>
          <Box
            bgcolor="components.bg"
            borderRadius="8px"
            boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
          >
            {exactlyStrategies.map((strategy, i) => (
              <Fragment key={strategy.title}>
                <StrategyRowCard {...strategy} />
                {i !== exactlyStrategies.length - 1 && <Divider key={`divider_${i}`} flexItem />}
              </Fragment>
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
            {thirdPartyStrategies.map((strategy, i) => (
              <Fragment key={strategy.title}>
                <StrategyRowCard {...strategy} />
                {i !== thirdPartyStrategies.length - 1 && <Divider key={`divider_${i}`} flexItem />}
              </Fragment>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Strategies;
