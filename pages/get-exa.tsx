import React from 'react';
import { NextPage } from 'next';
import { Box, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { GetEXAProvider } from '../contexts/GetEXAContext';
import { usePageView } from '../hooks/useAnalytics';
import GetEXA from '../components/getEXA';
import Link from 'next/link';

const GetExaPage: NextPage = () => {
  usePageView('/get-exa', 'Get EXA');

  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" mx="auto" maxWidth={480}>
      <Typography fontWeight={700} fontSize={24} mb={3}>
        {t(`Get EXA`)}
      </Typography>
      <Typography fontWeight={500} fontSize={16} mb={5}>
        <Trans
          i18nKey="Getting EXA gives you the ability to make the most of the Protocol's offerings, actively engaging in <a>Governance</a>, or joining the community as an EXA holder."
          components={{
            a: (
              <Link
                href="/governance"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'underline',
                }}
              >
                {t('Governance')}
              </Link>
            ),
          }}
        />
      </Typography>
      <GetEXAProvider>
        <GetEXA />
      </GetEXAProvider>
    </Box>
  );
};

export default GetExaPage;
