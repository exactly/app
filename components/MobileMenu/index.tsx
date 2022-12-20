import React, { FC, PropsWithChildren } from 'react';
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
  const { pathname: currentPathname, query } = useRouter();
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
              <Image src="/img/logo.svg" alt="Exactly Logo" layout="fixed" width={103} height={30} />
              <IconButton size="small" edge="start" aria-label="close" onClick={handleClose}>
                <CloseIcon sx={{ color: 'grey.300' }} />
              </IconButton>
            </Box>
            <Typography variant="subtitle2" color="grey.500" fontWeight={600} mt="18px">
              Menu
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {headers.map(({ title, pathname }) => (
                <Link href={{ pathname, query }} key={`mobile_tabs_${title}`}>
                  <a onClick={handleClose}>
                    <Typography
                      sx={{
                        textDecoration: currentPathname === pathname ? 'underline' : 'none',
                        fontWeight: 600,
                        fontSize: 32,
                      }}
                    >
                      {title}
                    </Typography>
                  </a>
                </Link>
              ))}
            </Box>
            <Divider sx={{ my: '12px' }} />
            <Typography variant="subtitle2" color="grey.500" fontWeight={600}>
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
          </Box>
          <Typography fontSize="16px" sx={{ color: 'grey.300' }}>
            © Exactly {date.getFullYear()}
          </Typography>
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
