import React from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from 'hooks/useWeb3';
import ConnectWalletGovernance from 'components/governance/ConnectWalletGovernance';
import Claimable from 'components/governance/Claimable';
import Delegation from 'components/governance/Delegation';
import VotingPower from 'components/governance/VotingPower';
import Proposals from 'components/governance/Proposals';
import useMerkleTree from 'hooks/useMerkleTree';

const DashBoard: NextPage = () => {
  const { t } = useTranslation();
  const { isConnected } = useWeb3();
  useMerkleTree(); // TESTING
  usePageView('/governance', 'Governance');

  return (
    <Box display="flex" flexDirection="column" mx="auto" gap={5} my={5} maxWidth={480}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography fontSize={24} fontWeight={700}>
          {t('Exactly Governance')}
        </Typography>
        <Typography>
          {t(
            "All EXA token-holders will have voting power, enabling them to actively participate in discussions, propose enhancements, and cast votes to shape the protocol's evolution. For further insights, explore our Governance documentation.",
          )}
        </Typography>
      </Box>
      {isConnected ? (
        <Box
          display="flex"
          flexDirection="column"
          p={4}
          gap={4}
          borderRadius="8px"
          bgcolor={({ palette }) => (palette.mode === 'dark' ? 'grey.100' : 'white')}
        >
          <Claimable />
          <VotingPower />
          <Delegation />
          <Proposals />
        </Box>
      ) : (
        <ConnectWalletGovernance />
      )}
    </Box>
  );
};

export default DashBoard;
