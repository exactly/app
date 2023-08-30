import React, { memo } from 'react';
import i18n from 'i18n';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useWeb3 } from 'hooks/useWeb3';
import { useAllowances } from 'hooks/useAllowances';
import AllowancesMobile from 'components/Allowances/AllowancesMobile';
import AllowancesTable from 'components/Allowances/AllowancesTable';
import Spender from 'components/Allowances/Spender';
import Amount from 'components/Allowances/Amount';
import Asset from 'components/Allowances/Asset';

export const allowanceColumns = () =>
  [
    {
      title: i18n.t('Asset'),
      sortKey: 'symbol',
      DisplayComponent: Asset,
    },
    {
      title: i18n.t('Authorized Amount'),
      sortKey: 'allowanceUSD',
      DisplayComponent: Amount,
    },
    {
      title: i18n.t('Authorized Spender'),
      sortKey: 'spenderName',
      DisplayComponent: Spender,
    },
  ] as const;

const Allowances = () => {
  const { t } = useTranslation();
  const { data, loading, update } = useAllowances();
  const { isConnected, connect } = useWeb3();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const AllowancesComponent = isMobile ? AllowancesMobile : AllowancesTable;
  return (
    <Box display="flex" flexDirection="column" pt={5}>
      <Box m="auto" display="flex" flexDirection="column">
        <Box>
          <Typography variant="h6" fontSize={24} fontWeight={700} mb={3}>
            {t('Allowances & Revoke')}
          </Typography>
          <Typography fontSize={16} fontWeight={500} mb={1}>
            {t(
              "Every time you perform an operation within our Protocol, you need to grant spending permission to the Protocol's smart contracts",
            )}
          </Typography>
          <Typography fontSize={16} fontWeight={500} mb={6}>
            {t(
              "To ensure your security against potential threats, we recommend checking your allowances regularly and revoking those you don't intend to use in the near future. Please remember that both allowing and revoking spending permissions involve on-chain transactions, which require gas fees.",
            )}
          </Typography>
        </Box>
        <Box
          bgcolor="components.bg"
          borderRadius={2}
          gap={2}
          boxShadow={'0px 3px 4px 0px rgba(97, 102, 107, 0.10)'}
          display="flex"
          flexDirection="column"
        >
          {isConnected ? (
            <AllowancesComponent data={data} loading={loading} update={update} />
          ) : (
            <Button onClick={connect} variant="contained" sx={{ mx: 'auto', my: 2 }}>
              {t('Connect wallet')}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default memo(Allowances);
