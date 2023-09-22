import React, { useMemo } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { optimism } from 'wagmi/chains';
import { useWeb3 } from 'hooks/useWeb3';

const Proposals = () => {
  const { t } = useTranslation();
  const { chain } = useWeb3();

  const spaceURL = useMemo(
    () => (chain.id === optimism.id ? 'https://gov.exact.ly/' : 'https://demo.snapshot.org/#/exa.eth'),
    [chain],
  );

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Divider flexItem />
      <Box display="flex" flexDirection="column" gap={4}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography variant="h6">{t('Proposals')}</Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={14}>{t('See our proposals on the governance forum via Snapshot.')}</Typography>
            <Typography fontSize={14}>
              {t("You can also create your own proposals and vote on other's proposals.")}
            </Typography>
          </Box>
        </Box>
        <a href={spaceURL} target="_blank" rel="noreferrer noopener">
          <Button variant="outlined" fullWidth endIcon={<OpenInNewIcon sx={{ height: 12 }} />}>
            https://gov.exact.ly/
          </Button>
        </a>
      </Box>
    </Box>
  );
};

export default Proposals;
