import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import SecurityIcon from '@mui/icons-material/Security';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Divider, IconButton, Modal, Slide, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import { useRouter } from 'next/router';

type Props = {
  open: boolean;
  handleClose: () => void;
};

function MobileMenu({ open, handleClose }: Props) {
  const { pathname: currentPathname, push, query } = useRouter();
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
            <Box display="flex" flexDirection="column" gap="16px">
              <Typography
                variant="h2"
                onClick={() => {
                  void push({ pathname: '/', query });
                  handleClose();
                }}
                sx={{ textDecoration: currentPathname === '/' ? 'underline' : 'none' }}
              >
                Markets
              </Typography>
              <Typography
                variant="h2"
                onClick={() => {
                  void push({ pathname: '/dashboard', query });
                  handleClose();
                }}
                sx={{ textDecoration: currentPathname === '/dashboard' ? 'underline' : 'none' }}
              >
                Dashboard
              </Typography>
            </Box>
            <Divider sx={{ my: '12px' }} />
            <Typography variant="subtitle2" color="grey.500" fontWeight={600}>
              Links
            </Typography>
            <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/security/audits">
              <Box display="flex" gap="10px">
                <SecurityIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
                <Typography variant="h6">Audits</Typography>
              </Box>
            </a>
            <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/">
              <Box display="flex" gap="10px">
                <MenuBookIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
                <Typography variant="h6">Documentation</Typography>
              </Box>
            </a>
            <a target="_blank" rel="noreferrer noopener" href="https://github.com/exactly">
              <Box display="flex" gap="10px">
                <GitHubIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
                <Typography variant="h6">Github</Typography>
              </Box>
            </a>
            <a target="_blank" rel="noreferrer noopener" href="https://twitter.com/exactlyprotocol">
              <Box display="flex" gap="10px">
                <TwitterIcon fontSize="small" sx={{ color: 'grey.500', my: 'auto' }} />
                <Typography variant="h6">Twitter</Typography>
              </Box>
            </a>
          </Box>
          <Typography fontSize="16px" sx={{ color: 'grey.300' }}>
            © Exactly {date.getFullYear()}
          </Typography>
        </Box>
      </Slide>
    </Modal>
  );
}

export default MobileMenu;
