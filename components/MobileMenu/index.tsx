import React, { FC, PropsWithChildren, useContext } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import SecurityIcon from '@mui/icons-material/Security';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Divider, IconButton, Modal, Slide, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Switch from 'components/Switch';
import { MarketContext } from 'contexts/MarketContext';

type Props = {
  open: boolean;
  handleClose: () => void;
};

const headers = [
  {
    title: 'Markets',
    pathname: '/',
  },
  {
    title: 'Dashboard',
    pathname: '/dashboard',
  },
];

function MobileMenu({ open, handleClose }: Props) {
  const { view, setView } = useContext(MarketContext);
  const { pathname: currentPathname } = useRouter();
  const date = new Date();

  return (
    <Modal open={open} aria-labelledby="user menu" aria-describedby="user menu on mobile">
      <Slide direction="left" in={open}>
        <Box
          width="100%"
          height="100%"
          bgcolor="white"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          padding="10px 16px 16px"
        >
          <Box display="flex" flexDirection="column" gap="20px">
            <Box display="flex" justifyContent="space-between">
              <Image src="/img/logo.svg" alt="Exactly Logo" width={103} height={30} />
              <IconButton size="small" edge="start" aria-label="close" onClick={handleClose}>
                <CloseIcon sx={{ color: 'figma.grey.300' }} />
              </IconButton>
            </Box>
            <Typography fontFamily="fontFamilyMonospaced" fontSize={13} color="figma.grey.500" fontWeight={600}>
              Menu
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {headers.map(({ title, pathname }) => (
                <Link href={pathname} key={`mobile_tabs_${title}`} onClick={handleClose}>
                  <Typography
                    sx={{
                      textDecoration: currentPathname === pathname ? 'underline' : 'none',
                      fontWeight: 700,
                      fontSize: 30,
                    }}
                  >
                    {title}
                  </Typography>
                </Link>
              ))}
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography fontSize={19} fontWeight={700}>
                Advanced view
              </Typography>
              <Switch
                checked={view === 'advanced'}
                onChange={() => setView(view === 'advanced' ? 'simple' : 'advanced')}
              />
            </Box>
            <Divider sx={{ my: '12px' }} />
            <Typography fontFamily="fontFamilyMonospaced" fontSize={13} color="figma.grey.500" fontWeight={600}>
              Links
            </Typography>
            <LinkItem title="Audits" href="https://docs.exact.ly/security/audits">
              <SecurityIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title="Documentation" href="https://docs.exact.ly/">
              <MenuBookIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title="Github" href="https://github.com/exactly">
              <GitHubIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title="Twitter" href="https://twitter.com/exactlyprotocol">
              <TwitterIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
            </LinkItem>
            <LinkItem title="Discord" href="https://discord.gg/exactly">
              <Image
                alt="discord"
                src="/img/social/discord.png"
                width={20}
                height={20}
                style={{ alignSelf: 'center' }}
              />
            </LinkItem>
          </Box>
          <Box>
            <Typography fontSize="16px" sx={{ color: 'figma.grey.300' }}>
              © Exactly {date.getFullYear()}
            </Typography>
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

export default MobileMenu;
