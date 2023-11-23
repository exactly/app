import React, { useCallback, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { optimism } from 'wagmi/chains';
import { useWeb3 } from 'hooks/useWeb3';
import { track } from 'utils/segment';

const Proposals = () => {
  const { t } = useTranslation();
  const { chain } = useWeb3();

  const spaceURL = useMemo(
    () => (chain.id === optimism.id ? 'https://gov.exact.ly/' : 'https://demo.snapshot.org/#/exa.eth'),
    [chain],
  );
  const handleClick = useCallback(() => {
    track('Button Clicked', {
      location: 'Governance',
      name: 'view proposals',
      href: spaceURL,
    });
  }, [spaceURL]);

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h6">{t('Proposals')}</Typography>
        <Typography fontSize={14}>
          {t(
            "Use your voting power to participate in discussions, propose enhancements, and cast votes to shape the Protocol's evolution on Snapchat",
          )}
        </Typography>
      </Box>
      <a href={spaceURL} target="_blank" rel="noreferrer noopener">
        <Button variant="contained" onClick={handleClick} fullWidth>
          {t('View Proposals')}
        </Button>
      </a>
    </Box>
  );
};

export default Proposals;
