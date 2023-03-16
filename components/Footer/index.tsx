import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import { globals } from 'styles/theme';
import { MarketContext } from 'contexts/MarketContext';
import SwitchTheme from 'components/SwitchTheme';
import { DiscordIcon } from 'components/Icons';
const { onlyDesktopFlex, maxWidth } = globals;

const Footer = () => {
  const date = new Date();
  const { view } = useContext(MarketContext);
  const { pathname } = useRouter();
  const { breakpoints, palette } = useTheme();
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
              maxWidth,
              mx: 'auto',
            }}
          >
            <Typography fontWeight={700} fontSize={13}>
              Have feedback?
            </Typography>
            <Typography color="figma.grey.600" fontWeight={500} fontSize={13}>
              We are always looking for ways to improve. If you have suggestions,{' '}
              <a
                target="_blank"
                rel="noreferrer noopener"
                href="https://discord.com/channels/846682395553824808/908758791057719358"
                style={{ color: palette.mode === 'light' ? 'black' : 'white', textDecoration: 'underline' }}
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
                Give us feedback
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
              <DiscordIcon fontSize="small" />
            </a>
            <SwitchTheme />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
