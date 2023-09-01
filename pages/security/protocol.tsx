import React from 'react';
import type { NextPage } from 'next';

import { usePageView } from 'hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

const Security: NextPage = () => {
  usePageView('/security', 'Security');
  const { t } = useTranslation();
  const { query } = useRouter();

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
      <Box my={3}>Accordion</Box>
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
