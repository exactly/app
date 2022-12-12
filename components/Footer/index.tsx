import { Box } from '@mui/system';
import React from 'react';
import { globals } from 'styles/theme';
import { Typography } from '@mui/material';
const { maxWidth } = globals;

const Footer = () => {
  const date = new Date();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }} mx="8px">
      <Box sx={{ maxWidth, width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            border: '1px solid #E0E0E0',
            borderRadius: '6px',
            padding: '16px 24px',
            gap: '8px',
          }}
        >
          <Typography fontWeight={600}>Have feedback?</Typography>
          <Typography color="grey.700">
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 0px',
            color: 'grey.300',
            fontWeight: '500',
          }}
        >
          <Typography fontSize="0.85em">© Exactly {date.getFullYear()}</Typography>
          <Box sx={{ display: 'flex' }}>
            <Typography fontSize="0.85em">
              <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/security/audits">
                Audits
              </a>
            </Typography>
            <Typography fontSize="0.85em" px="10px">
              |
            </Typography>
            <Typography fontSize="0.85em">
              <a target="_blank" rel="noreferrer noopener" href="https://docs.exact.ly/">
                Documentation
              </a>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
