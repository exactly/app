import React from 'react';
import { Avatar, Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const Velodrome = () => {
  const { t } = useTranslation();

  return (
    <Link
      target="_blank"
      href="https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth&stable=false"
      rel="noreferrer noopener"
    >
      <Button variant="outlined">
        <Box display="flex" gap={0.5} alignItems="center">
          <Avatar
            alt="Velodrome Token"
            src={`/img/assets/VELO.svg`}
            sx={{ width: 16, height: 16, fontSize: 10, borderColor: 'transparent' }}
          />
          <Typography fontSize={14} fontWeight={700} noWrap>
            {t('Stake EXA')}
          </Typography>
          <OpenInNewIcon
            sx={{
              height: 14,
              width: 14,
              color: 'grey.900',
            }}
          />
        </Box>
      </Button>
    </Link>
  );
};

export default Velodrome;
