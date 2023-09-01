import React from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { Box, Divider, Typography } from '@mui/material';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';

const Security: NextPage = () => {
  usePageView('/security', 'Security');
  const { t } = useTranslation();
  const { query } = useRouter();

  return (
    <Box display="flex" flexDirection="column" gap={3} maxWidth={640} mx="auto" my={3}>
      <Typography fontSize={24} fontWeight={700}>
        {t('Security Hub')}
      </Typography>
      <Typography>
        {t(
          "Here you'll discover comprehensive details about the security measures we have in place. Our utmost priority is to ensure the security of your funds through fully decentralized methods. If you have any inquiries or suggestions to enhance our efforts, we encourage you to reach out to us on our Discord server.",
        )}
      </Typography>
      <Divider flexItem sx={{ my: 3 }} />
      <Typography variant="h6">{t('Smart Contracts')}</Typography>
      <Box display="flex" flexDirection="column">
        <Link href={{ pathname: `/security/protocol`, query }} legacyBehavior>
          <Box display="flex" justifyContent="space-between" p={2} gap={1} sx={{ cursor: 'pointer' }}>
            <Typography fontSize={16} fontWeight={700}>
              {t('Protocol Contracts')}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                textTransform="uppercase"
                fontSize={12}
                fontWeight={700}
                color="white"
                bgcolor="green"
                borderRadius="4px"
                px={0.5}
              >{`8 ${t('Audited')}`}</Typography>
              <KeyboardArrowRightRoundedIcon />
            </Box>
          </Box>
        </Link>
        <Divider />
        <Link href={{ pathname: `/security/periphery`, query }} legacyBehavior>
          <Box display="flex" justifyContent="space-between" p={2} gap={1} sx={{ cursor: 'pointer' }}>
            <Typography fontSize={16} fontWeight={700}>
              {t('Periphery Contracts')}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                textTransform="uppercase"
                fontSize={12}
                fontWeight={700}
                color="white"
                bgcolor="green"
                borderRadius="4px"
                px={0.5}
              >{`7 ${t('Audited')}`}</Typography>
              <KeyboardArrowRightRoundedIcon />
            </Box>
          </Box>
        </Link>
      </Box>
      <Divider flexItem sx={{ my: 3 }} />
      <Typography variant="h6">{t('Connecting to Exactly, Spending Limits and Revoking Allowances')}</Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography>
          {t(
            "Connecting your wallet to Exactly (or any dapp) is different from allowing a smart contract to spend your tokens. Here, we'll explore these processes and their security distinctions.",
          )}
        </Typography>
        <Typography>{t('When you connect your wallet to Exactly, you authorize the Protocol to:')}</Typography>
        <Typography component="div">
          <ul>
            <li>{t('Access your public address.')}</li>
            <li>{t('Prompt you to confirm and send transactions.')}</li>
            <li>{t('Check token balances, facilitating interaction.')}</li>
          </ul>
        </Typography>
        <Typography>
          {t(
            'Disconnecting your wallet is a wise privacy measure. However, another connection managed by on-chain smart contracts can pose a potential risk to your funds.',
          )}
        </Typography>
        <Typography>
          {t(
            "For deposit assets in Exactly, you provide the Protocol's smart contracts with spending permission. This allowance process empowers the Protocol's smart contracts to utilize your tokens. You control the permitted amount per token via wallet-signed on-chain transactions, incurring gas fees. To minimize fees and enhance your experience, we introduced the Permits model. More details can be found here.",
          )}
        </Typography>
        <Typography>
          {t('Most dapps encourage unlimited token allowances to avoid repeated spending limit approvals.')}
        </Typography>
        <Typography>
          {t(
            'This means that if you grant a smart contract access to 1,000 USDC, it can repeatedly do so with your permission. Beyond 1,000 tokens, a new allowance transaction is required.',
          )}
        </Typography>
        <Typography>
          {t(
            'Multiple token allowances from various web3 apps could expose you to security threats. Regularly reviewing and revoking approvals helps mitigate these risks.',
          )}
        </Typography>
        <Typography>
          {t(
            'At Exactly, user security is paramount, that’s why we offer a revoke tool for allowances within the app:',
          )}
        </Typography>
        <Typography component="div">
          <ul>
            <li>{t('Via your wallet address in the navigation bar by selecting "Manage allowances."')}</li>
            <li>{t('After each operation (e.g., deposit, borrow) from the success screen.')}</li>
          </ul>
        </Typography>
      </Box>
      <Divider flexItem sx={{ my: 3 }} />
      <Typography variant="h6">{t('Permits Model')}</Typography>
      <Typography>
        {t(
          `For security reasons, this contract uses 'permits' for approvals related to allowing you to transfer tokens on your behalf and perform withdrawals or borrows from a Market. Permits are signatures spent when the user completes the transaction, and the approved amount is always exact. After the leverage or deleverage operation is completed, the DebtManager no longer has any allowance over tokens, withdraws or borrows.`,
        )}
      </Typography>
    </Box>
  );
};

export default Security;
