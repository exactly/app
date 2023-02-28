import React, { useContext } from 'react';
import Image from 'next/image';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import { globals } from 'styles/theme';
import { MarketContext } from 'contexts/MarketContext';
import useRouter from 'hooks/useRouter';
const { maxWidth, onlyDesktopFlex } = globals;

const Footer = () => {
  const date = new Date();
  const { view } = useContext(MarketContext);
  const { pathname } = useRouter();
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: '100%' }}>
        {(isMobile || view === 'advanced' || pathname !== '/') && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              border: '1px solid #E0E0E0',
              borderRadius: '6px',
              padding: 2,
              gap: 0.5,
            }}
          >
            <Typography fontWeight={700} fontSize={14}>
              Have feedback?
            </Typography>
            <Typography color="figma.grey.600" fontWeight={500} fontSize={14}>
              We are always looking for ways to improve. If you have suggestions,{' '}
              <a
                target="_blank"
                rel="noreferrer noopener"
                href="https://discord.com/channels/846682395553824808/908758791057719358"
                style={{ color: 'black', textDecoration: 'underline' }}
              >
                let us know here.
              </a>
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'space-between' },
            padding: '16px 0px',
            color: 'figma.grey.300',
            fontWeight: '500',
          }}
        >
          <Typography fontSize="0.85em">© Exactly {date.getFullYear()}</Typography>
          <Box sx={{ display: onlyDesktopFlex, gap: 1.5 }}>
            <Typography fontSize="0.85em">
              <a
                target="_blank"
                rel="noreferrer noopener"
                href="https://discord.com/channels/846682395553824808/908758791057719358"
              >
                Gives us feedback
              </a>
            </Typography>
            <Typography fontSize="0.85em">|</Typography>
            <Typography fontSize="0.85em">
              <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/security/audits">
                Audits
              </a>
            </Typography>
            <Typography fontSize="0.85em">|</Typography>
            <Typography fontSize="0.85em">
              <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/">
                Documentation
              </a>
            </Typography>
            <a target="_blank" rel="noreferrer noopener" href="https://github.com/exactly">
              <GitHubIcon fontSize="small" />
            </a>
            <a target="_blank" rel="noreferrer noopener" href="https://twitter.com/exactlyprotocol">
              <TwitterIcon fontSize="small" />
            </a>
            <a target="_blank" rel="noreferrer noopener" href="https://discord.gg/exactly">
              <Image alt="discord" src="/img/social/discord.png" width={20} height={20} />
            </a>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
