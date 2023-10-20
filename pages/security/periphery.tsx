import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ContractInfo from 'components/ContractInfo';
import useGetContractAddress from 'hooks/useContractAddress';
import { ContractInfoType } from 'types/ContractInfoType';
import { optimism } from 'viem/chains';
import { useWeb3 } from 'hooks/useWeb3';

const Security: NextPage = () => {
  usePageView('/security', 'Security');
  const { t } = useTranslation();
  const { query } = useRouter();
  const getContractAddress = useGetContractAddress();
  const [contractsData, setContractsData] = useState<ContractInfoType[]>([]);
  const { chain: displayNetwork } = useWeb3();

  const contracts = useMemo(
    () => [
      ...(displayNetwork.id === optimism.id
        ? [
            {
              name: 'DebtManager.sol',
              audited: true,
              description: t(
                'The DebtManager contract is responsible for the leverage, deleverage, and rollover functionality of the protocol.',
              ),
              reports: ['ABDK'],
              information: [`629 ${t('lines')} (515 ${t('lines of code')}), 24.9 kb`],
              proxy: async () => {
                return [{ name: '', address: await getContractAddress('DebtManager_Proxy') }];
              },
              implementation: async () => {
                return [{ name: '', address: await getContractAddress('DebtManager_Implementation') }];
              },
              codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/periphery/DebtManager.sol',
            },
            {
              name: 'Airdrop.sol',
              audited: true,
              description: t(
                'The EXA smart contract encapsulates the functionality of the EXA ERC20 token. This smart contract uses OpenZeppelin’s ERC20VotesUpgradeable implementation.',
              ),
              reports: ['ABDK'],
              information: [`24 ${t('lines')} (20 ${t('lines of code')}), 674 bytes`],
              proxy: async () => {
                return [{ name: '', address: await getContractAddress('Airdrop_Proxy') }];
              },
              implementation: async () => {
                return [{ name: '', address: await getContractAddress('Airdrop_Implementation') }];
              },
              codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/periphery/EXA.sol',
            },
            {
              name: 'EXA.sol',
              audited: true,
              description: t(
                'Using Solmate’s Merkle tree library, this smart contract can validate the eligibility of an address for the airdrop and the appropriate amount based on a set of predetermined criteria.',
              ),
              reports: ['ABDK'],
              information: [`79 ${t('lines')} (65 ${t('lines of code')}), 2.25 kb`],
              proxy: async () => {
                return [{ name: '', address: await getContractAddress('EXA_Proxy') }];
              },
              implementation: async () => {
                return [{ name: '', address: await getContractAddress('EXA_Implementation') }];
              },
              codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/periphery/Airdrop.sol',
            },
            {
              name: 'esEXA.sol',
              audited: true,
              description: t(
                'The EscrowedEXA contract is an ERC-20 token that allows anyone to mint esEXA tokens in exchange for EXA tokens.',
              ),
              reports: ['ABDK', 'OpenZeppelin'],
              information: [`279 ${t('lines')} (242 ${t('lines of code')}), 10.5 kb`],
              proxy: async () => {
                return [{ name: '', address: await getContractAddress('EscrowedEXA_Proxy') }];
              },
              implementation: async () => {
                return [{ name: '', address: await getContractAddress('EscrowedEXA_Implementation') }];
              },
              codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/periphery/EscrowedEXA.sol',
            },
          ]
        : []),
    ],
    [displayNetwork.id, getContractAddress, t],
  );

  useEffect(() => {
    async function fetchContractsData() {
      const results = await Promise.all(
        contracts.map(async (contract) => {
          const proxyData = await contract.proxy();
          const implementationData = await contract.implementation();
          return {
            ...contract,
            proxy: proxyData,
            implementation: implementationData,
          };
        }),
      );
      setContractsData(results);
    }

    fetchContractsData();
  }, [contracts]);

  return (
    <Box display="flex" flexDirection="column" gap={3} maxWidth={640} mx="auto" my={3}>
      <Link href={{ pathname: `/security`, query }} legacyBehavior>
        <Button
          startIcon={<ArrowBackRoundedIcon sx={{ width: 18 }} />}
          sx={{ maxWidth: 'fit-content', ml: -1, px: 1, color: 'figma.grey.600' }}
        >
          {t('Back to Security Hub')}
        </Button>
      </Link>
      <Typography fontSize={24} fontWeight={700}>
        {t('Periphery Contracts')}
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography>
          {t('This section outlines the specific roles and deployment details of the periphery contracts.')}
        </Typography>
        <Typography>
          {t(
            "Our rigorous security practices include subjecting each contract interacting with the app's frontend to meticulous external audits performed by reputable third-party organizations. Links to audit reports and GitHub repositories are provided for your review and confidence.",
          )}
        </Typography>
      </Box>
      <Box my={3}>
        {contractsData.map((contract) => (
          <ContractInfo
            key={contract.name}
            name={contract.name}
            audited={contract.audited}
            description={contract.description}
            reports={contract.reports}
            information={contract.information}
            proxy={contract.proxy}
            implementation={contract.implementation}
            codeLink={contract.codeLink}
          />
        ))}
      </Box>
      <Link href={{ pathname: `/security/protocol`, query }} legacyBehavior>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          gap={1}
          border="1px solid"
          borderRadius="4px"
          borderColor="grey.300"
          sx={{ cursor: 'pointer' }}
        >
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={12}>{t('Next')}</Typography>
            <Typography fontSize={16} fontWeight={700}>
              {t('Protocol Contracts')}
            </Typography>
          </Box>
          <ArrowForwardRoundedIcon sx={{ color: 'figma.grey.500', fontSize: 18 }} />
        </Box>
      </Link>
    </Box>
  );
};

export default Security;
