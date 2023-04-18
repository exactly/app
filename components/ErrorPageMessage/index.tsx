import React from 'react';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';

type Props = {
  code: number;
  description: string;
  message: string;
};

function ErrorPageMessage({ code, description, message }: Props) {
  const { t } = useTranslation();
  const { query } = useRouter();

  return (
    <Box display="flex" height="100%">
      <Box display="flex" flexDirection="column" m="auto" alignItems="center" gap={1}>
        <Typography variant="h1" fontWeight={700}>
          {code}
        </Typography>
        <Typography variant="h2" fontWeight={700}>
          {description}
        </Typography>
        <Typography>{message}</Typography>
        <Link href={{ pathname: '/', query }}>
          <Button variant="contained">{t('Go to Markets')}</Button>
        </Link>
      </Box>
    </Box>
  );
}

export default ErrorPageMessage;
