import React from 'react';
import useRouter from 'hooks/useRouter';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

type Props = {
  code: number;
  description: string;
  message: string;
};

function ErrorPageMessage({ code, description, message }: Props) {
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
          <Button variant="contained">Go to Markets</Button>
        </Link>
      </Box>
    </Box>
  );
}

export default ErrorPageMessage;
