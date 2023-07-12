import React, { FC, PropsWithChildren } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import SecurityIcon from '@mui/icons-material/Security';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Divider, IconButton, Modal, Slide, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import useRouter from 'hooks/useRouter';
import Link from 'next/link';
import Switch from 'components/Switch';
import { DiscordIcon } from 'components/Icons';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SwitchTheme from 'components/SwitchTheme';
import { useTranslation } from 'react-i18next';
import SelectLanguage from 'components/SelectLanguage';
import { useMarketContext } from 'contexts/MarketContext';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { optimism } from 'wagmi/chains';
import { useWeb3 } from 'hooks/useWeb3';

type Props = {
  open: boolean;
  handleClose: () => void;
};

function MobileMenu({ open, handleClose }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { pathname: currentPathname, query } = useRouter();
  const date = new Date();
  const { chain } = useWeb3();
  const isOPMainnet = chain?.id === optimism.id;

  const headers = [
    {
      title: t('Markets'),
      pathname: '/',
      component: <AdvancedViewSwitch />,
      icon: <BarChartRoundedIcon sx={{ fontSize: 20 }} />,
    },
    {
      title: t('Dashboard'),
      pathname: '/dashboard',
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />,
    },
    ...(isOPMainnet
      ? [
          {
            title: t('Bridge & Swap'),
            pathname: '/bridge',
            icon: <RepeatRoundedIcon sx={{ fontSize: 20 }} />,
          },
        ]
      : []),
  ];

  return (
    <Modal open={open} aria-labelledby="user menu" aria-describedby="user menu on mobile">
      <Slide direction="left" in={open}>
        <Box
          width="100%"
          height="100%"
          bgcolor="components.bg"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          padding="10px 16px 16px"
        >
          <Box display="flex" flexDirection="column" gap="20px">
            <Box display="flex" justifyContent="space-between">
              <Image
                src={palette.mode === 'light' ? '/img/logo.svg' : '/img/logo-white.png'}
                alt="Exactly Logo"
                width={103}
                height={30}
              />
              <IconButton size="small" edge="start" aria-label="close" onClick={handleClose}>
                <CloseIcon sx={{ color: 'figma.grey.300' }} />
              </IconButton>
            </Box>
            <Typography fontFamily="fontFamilyMonospaced" fontSize={14} color="figma.grey.500" fontWeight={600}>
              {t('Menu')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {headers.map(({ title, pathname, component, icon }) => (
                <Box key={`mobile_tabs_${title}`} display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Link href={{ pathname, query }} onClick={handleClose}>
                      <Box display="flex" gap={1} alignItems="center">
                        {icon}
                        <Typography
                          sx={{
                            textDecoration: currentPathname === pathname ? 'underline' : 'none',
                            fontWeight: 700,
                            fontSize: 24,
                          }}
                        >
                          {title}
                        </Typography>
                      </Box>
                    </Link>
                    {component}
                  </Box>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: '12px' }} />
            <Typography fontFamily="fontFamilyMonospaced" fontSize={14} color="figma.grey.500" fontWeight={600}>
              {t('Links')}
            </Typography>
            <LinkItem title={t('Audits')} href="https://docs.exact.ly/security/audits">
              <SecurityIcon fontSize="small" sx={{ color: 'figma.grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Documentation')} href="https://docs.exact.ly/">
              <MenuBookIcon fontSize="small" sx={{ color: 'figma.grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Github')} href="https://github.com/exactly">
              <GitHubIcon fontSize="small" sx={{ color: 'figma.grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Twitter')} href="https://twitter.com/exactlyprotocol">
              <TwitterIcon fontSize="small" sx={{ color: 'figma.grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Discord')} href="https://discord.gg/exactly">
              <DiscordIcon fontSize="small" sx={{ fill: palette.figma.grey[500], my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Stats')} href="https://dune.com/exactly/exactly">
              <QueryStatsIcon fontSize="small" sx={{ color: 'figma.grey.500', my: 'auto' }} />
            </LinkItem>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontSize={14} sx={{ color: 'figma.grey.300' }}>
              © Exactly {date.getFullYear()}
            </Typography>
            <Box>
              <SelectLanguage />
              <SwitchTheme />
            </Box>
          </Box>
        </Box>
      </Slide>
    </Modal>
  );
}

const LinkItem: FC<PropsWithChildren & { title: string; href: string }> = ({ children, title, href }) => (
  <a target="_blank" rel="noreferrer noopener" href={href}>
    <Box display="flex" gap="10px">
      {children}
      <Typography fontWeight={500} color="figma.grey.500">
        {title}
      </Typography>
    </Box>
  </a>
);

const AdvancedViewSwitch: FC = () => {
  const { t } = useTranslation();
  const { view, setView } = useMarketContext();
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
      <Typography fontSize={14}>{t('Advanced view')}</Typography>
      <Switch
        checked={view === 'advanced'}
        onChange={() => setView(view === 'advanced' ? 'simple' : 'advanced')}
        inputProps={{
          'aria-label':
            t('Switch to {{view}} view', { view: view === 'advanced' ? t('simple') : t('advanced') }) ?? undefined,
          'data-testid': 'switch-markets-view',
        }}
      />
    </Box>
  );
};

export default MobileMenu;
