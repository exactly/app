import React, { useState, useEffect, useMemo } from 'react';
import type { NextPage } from 'next';

import { useTranslation } from 'react-i18next';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ContractInfo from 'components/ContractInfo';
import { ContractInfoType } from 'types/ContractInfoType';
import useContractAddress from 'hooks/useContractAddress';
import { useWeb3 } from 'hooks/useWeb3';
import { mainnet, optimismSepolia, optimism } from 'viem/chains';

const Security: NextPage = () => {
  const { t } = useTranslation();
  const { query } = useRouter();
  const [contractsData, setContractsData] = useState<ContractInfoType[]>([]);

  const getContractAddress = useContractAddress();
  const {
    chain: { id: displayNetworkId },
  } = useWeb3();

  const contracts = useMemo(
    () => [
      {
        name: 'Auditor.sol',
        audited: true,
        description: t(
          'The Auditor is the risk management layer of the protocol; it determines how much collateral a user is required to maintain, and whether (and by how much) a user can be liquidated. Each time a user borrows from a Market, the Auditor validates his account’s liquidity to determine his health factor.',
        ),
        reports: ['ABDK', 'Coinspect'],
        information: [`482 ${t('lines')} (409 ${t('lines of code')}), 20.5 kb`],
        proxy: async () => {
          return [{ name: '', address: await getContractAddress('Auditor') }];
        },
        implementation: async () => {
          return [{ name: '', address: await getContractAddress('Auditor') }];
        },
        codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/Auditor.sol',
      },
      {
        name: 'InterestRateModel.sol',
        audited: true,
        description: t(
          'Given supply and demand values, the InterestRateModel is queried to calculate and return both fixed and variable rates. Contains parameters as state variables that are used to get the different points in the utilization curve for an asset. There’s one InterestRateModel contract per enabled asset.',
        ),
        reports: ['ABDK', 'Coinspect'],
        information: [`131 ${t('lines')} (113 ${t('lines of code')}), 5.39 kb`],
        proxy: async () => {
          return [
            { name: 'USDC', address: await getContractAddress('InterestRateModelUSDC') },
            { name: 'WETH', address: await getContractAddress('InterestRateModelWETH') },
            { name: 'wstETH', address: await getContractAddress('InterestRateModelwstETH') },
            ...(displayNetworkId === optimism.id
              ? [{ name: 'OP', address: await getContractAddress('InterestRateModelOP') }]
              : displayNetworkId === mainnet.id || displayNetworkId === optimismSepolia.id
                ? [
                    { name: 'DAI', address: await getContractAddress('InterestRateModelDAI') },
                    { name: 'WBTC', address: await getContractAddress('InterestRateModelWBTC') },
                  ]
                : []),
          ];
        },
        implementation: (): null => {
          return null;
        },
        codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/InterestRateModel.sol',
      },
      {
        name: 'Market.sol',
        audited: true,
        description: t(
          'ERC-4626 is an implementation of a standard API for tokenized vaults representing shares of a single underlying token. This standard is an extension of the ERC-20 token standard that provides basic functionality for depositing and withdrawing tokens and reading balances.',
        ),
        reports: ['ABDK', 'Coinspect'],
        information: [`1299 ${t('lines')} (1107 ${t('lines of code')}), 57 kb`],
        proxy: async () => {
          return [
            { name: 'USDC', address: await getContractAddress('MarketUSDC_Proxy') },
            { name: 'WETH', address: await getContractAddress('MarketWETH_Proxy') },
            { name: 'wstETH', address: await getContractAddress('MarketwstETH_Proxy') },
            ...(displayNetworkId === optimism.id
              ? [{ name: 'OP', address: await getContractAddress('MarketOP_Proxy') }]
              : displayNetworkId === mainnet.id || displayNetworkId === optimismSepolia.id
                ? [
                    { name: 'DAI', address: await getContractAddress('MarketDAI_Proxy') },
                    { name: 'WBTC', address: await getContractAddress('InterestRateModelWBTC') },
                  ]
                : []),
          ];
        },
        implementation: async () => {
          return [
            { name: 'USDC', address: await getContractAddress('MarketUSDC_Implementation') },
            { name: 'WETH', address: await getContractAddress('MarketWETH_Implementation') },
            { name: 'wstETH', address: await getContractAddress('MarketwstETH_Implementation') },
            ...(displayNetworkId === optimism.id
              ? [{ name: 'OP', address: await getContractAddress('MarketOP_Implementation') }]
              : displayNetworkId === mainnet.id || displayNetworkId === optimismSepolia.id
                ? [
                    { name: 'DAI', address: await getContractAddress('MarketDAI_Implementation') },
                    { name: 'WBTC', address: await getContractAddress('MarketWBTC_Implementation') },
                  ]
                : []),
          ];
        },
        codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/Market.sol',
      },
      {
        name: 'MarketETHRouter.sol',
        audited: true,
        description: t(
          'To be used by Exactly Protocol’s web-app, so accounts can operate with ETH on MarketWETH. Wraps ETH or unwraps WETH before and after interacting with MarketWETH. It saves one step for the user.',
        ),
        reports: ['ABDK', 'Coinspect'],
        information: [`150 ${t('lines')} (126 ${t('lines of code')}), 6.24 kb`],
        proxy: async () => {
          return [{ name: '', address: await getContractAddress('MarketETHRouter_Proxy') }];
        },
        implementation: async () => {
          return [{ name: '', address: await getContractAddress('MarketETHRouter_Implementation') }];
        },
        codeLink: 'https://github.com/exactly/protocol/blob/main/contracts/MarketETHRouter.sol',
      },
      {
        name: 'RewardsController.sol',
        audited: true,
        description: t(
          'The RewardsController is designed to store and distribute rewards to accounts that interact with the Markets different variable and fixed pools. It calculates the total amount of rewards to distribute and determines the allocation between the pools based on a dynamic distribution model. Accounts can claim their rewards through the contract, and their claimable rewards can be queried at any time using the claimable function.',
        ),
        reports: ['ABDK', 'Coinspect'],
        information: [`932 ${t('lines')} (873 ${t('lines of code')}), 36.5 kb`],
        proxy: async () => {
          return [{ name: '', address: await getContractAddress('RewardsController_Proxy') }];
        },
        implementation: async () => {
          return [{ name: '', address: await getContractAddress('RewardsController_Implementation') }];
        },
        codeLink: '',
      },
    ],
    [displayNetworkId, getContractAddress, t],
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
        {t('Protocol Contracts')}
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography>
          {t("This section outlines the specific roles and deployment details of the protocol's core contracts.")}
        </Typography>
        <Typography>
          {t(
            "Our rigorous security practices include subjecting each contract interacting with the app's frontend to meticulous external audits performed by reputable third-party organizations. Links to audit reports and GitHub repositories are provided for your review and confidence.",
          )}
        </Typography>
      </Box>
      <Box my={3}>
        {contractsData.length > 0 ? (
          contractsData.map((contract, index) => (
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
              withBorder={index !== contracts.length - 1}
            />
          ))
        ) : (
          <>
            <Skeleton height={80} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </>
        )}
      </Box>
      <Link href={{ pathname: `/security/periphery`, query }} legacyBehavior>
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
              {t('Periphery Contracts')}
            </Typography>
          </Box>
          <ArrowForwardRoundedIcon sx={{ color: 'figma.grey.500', fontSize: 18 }} />
        </Box>
      </Link>
    </Box>
  );
};

export default Security;
