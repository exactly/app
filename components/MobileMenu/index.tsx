import React, { FC, PropsWithChildren, useContext } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import SecurityIcon from '@mui/icons-material/Security';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Divider, IconButton, Modal, Slide, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Switch from 'components/Switch';
import { MarketContext } from 'contexts/MarketContext';
import { DiscordIcon } from 'components/Icons';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SwitchTheme from 'components/SwitchTheme';
import { useTranslation } from 'react-i18next';
import SelectLanguage from 'components/SelectLanguage';

type Props = {
  open: boolean;
  handleClose: () => void;
};

function MobileMenu({ open, handleClose }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { pathname: currentPathname, query } = useRouter();
  const date = new Date();

  const headers = [
    {
      title: t('Markets'),
      pathname: '/',
      component: <AdvancedViewSwitch />,
    },
    {
      title: t('Dashboard'),
      pathname: '/dashboard',
    },
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
              {headers.map(({ title, pathname, component }) => (
                <>
                  <Link href={{ pathname, query }} key={`mobile_tabs_${title}`} onClick={handleClose}>
                    <Typography
                      sx={{
                        textDecoration: currentPathname === pathname ? 'underline' : 'none',
                        fontWeight: 700,
                        fontSize: 28,
                      }}
                    >
                      {title}
                    </Typography>
                  </Link>
                  {component}
                </>
              ))}
            </Box>
            <Divider sx={{ my: '12px' }} />
            <Typography fontFamily="fontFamilyMonospaced" fontSize={14} color="figma.grey.500" fontWeight={600}>
              {t('Links')}
            </Typography>
            <LinkItem title={t('Audits')} href="https://docs.exact.ly/security/audits">
              <SecurityIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Documentation')} href="https://docs.exact.ly/">
              <MenuBookIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Github')} href="https://github.com/exactly">
              <GitHubIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Twitter')} href="https://twitter.com/exactlyprotocol">
              <TwitterIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Discord')} href="https://discord.gg/exactly">
              <DiscordIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title={t('Stats')} href="https://dune.com/exactly/exactly">
              <QueryStatsIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography fontSize="16px" sx={{ color: 'figma.grey.300' }}>
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
      <Typography variant="h6">{title}</Typography>
    </Box>
  </a>
);

const AdvancedViewSwitch: FC = () => {
  const { t } = useTranslation();
  const { view, setView } = useContext(MarketContext);
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
      <Typography fontSize={19} fontWeight={700}>
        {t('Advanced view')}
      </Typography>
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
