import React from 'react';
import type { NextPage } from 'next';

import { Box, Typography } from '@mui/material';
import { useTranslation, Trans } from 'react-i18next';
import { useWeb3 } from 'hooks/useWeb3';
import ConnectWalletGovernance from 'components/governance/ConnectWalletGovernance';
import Claimable from 'components/governance/Claimable';
import Delegation from 'components/governance/Delegation';
import Proposals from 'components/governance/Proposals';
import useMerkleTree from 'hooks/useMerkleTree';
import { useModal } from 'contexts/ModalContext';
import { track } from 'utils/mixpanel';

const Governance: NextPage = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, impersonateActive } = useWeb3();
  const mTree = useMerkleTree(walletAddress);
  const { open: openGetEXA } = useModal('exa');

  return (
    <Box display="flex" flexDirection="column" mx="auto" gap={5} my={5} maxWidth={480}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography fontSize={24} fontWeight={700}>
          {t('Exactly Protocol DAO Governance')}
        </Typography>
        <Typography>
          {t(
            "All EXA token holders will have voting power to participate actively in discussions, propose enhancements, and cast votes to shape the protocol's evolution.",
          )}
        </Typography>
        <Typography>
          <Trans
            i18nKey="You can <1>get EXA</1> if you are not a token holder or need more to create a proposal."
            components={{
              1: (
                <button
                  onClick={() => {
                    openGetEXA();
                    track('Button Clicked', {
                      location: 'Vesting',
                      name: 'get EXA',
                    });
                  }}
                  style={{
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 'unset',
                    background: 'unset',
                    border: 'unset',
                    fontSize: 'unset',
                    color: 'unset',
                  }}
                />
              ),
            }}
          />
        </Typography>
        <Typography>
          <Trans
            i18nKey="More information in our <1>docs</1>."
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
