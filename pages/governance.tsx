import React from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { Box, Typography } from '@mui/material';
import { useTranslation, Trans } from 'react-i18next';
import { useWeb3 } from 'hooks/useWeb3';
import ConnectWalletGovernance from 'components/governance/ConnectWalletGovernance';
import Claimable from 'components/governance/Claimable';
import Delegation from 'components/governance/Delegation';
import Proposals from 'components/governance/Proposals';
import useMerkleTree from 'hooks/useMerkleTree';

const Governance: NextPage = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, impersonateActive } = useWeb3();
  const mTree = useMerkleTree(walletAddress);

  usePageView('/governance', 'Governance');

  return (
    <Box display="flex" flexDirection="column" mx="auto" gap={5} my={5} maxWidth={480}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography fontSize={24} fontWeight={700}>
          {t('Exactly Protocol DAO Governance')}
        </Typography>
        <Typography>
          <Trans
            i18nKey="All EXA token-holders will have voting power, enabling them to actively participate in discussions, propose enhancements, and cast votes to shape the protocol's evolution. More information in our <1>docs</1>."
            components={{
              1: (
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://docs.exact.ly/governance/exactly-protocol-governance"
                  style={{ textDecoration: 'underline' }}
                ></a>
              ),
            }}
          />
        </Typography>

        <Box
          display="flex"
          flexDirection="column"
          p={4}
          gap={4}
          borderRadius="8px"
          bgcolor={({ palette }) => (palette.mode === 'dark' ? 'grey.100' : 'white')}
        >
          <Proposals />
        </Box>
      </Box>

      {isConnected || impersonateActive ? (
        <Box
          display="flex"
          flexDirection="column"
          p={4}
          gap={4}
          borderRadius="8px"
          bgcolor={({ palette }) => (palette.mode === 'dark' ? 'grey.100' : 'white')}
        >
          {mTree.canClaim && <Claimable amount={mTree.amount} proof={mTree.proof} />}
          <Delegation />
        </Box>
      ) : (
        <ConnectWalletGovernance />
      )}
    </Box>
  );
};

export default Governance;
