import React, { FC } from 'react';
import { Avatar, Box, Button, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useExtra } from 'hooks/useExtra';

const EXTRA_EXA_LENDING_POOL_URL = 'https://app.extrafi.io/lend/EXA';

const ExtraFinance: FC = () => {
  const { t } = useTranslation();
  const { apr, apy } = useExtra();

  return (
    <Tooltip
      title={t('Deposit EXA on Extra Finance and get {{apy}} APY', {
        apy,
      })}
      arrow
      placement="bottom"
    >
      <a href={EXTRA_EXA_LENDING_POOL_URL} target="_blank" rel="noreferrer noopener">
        <Button variant="outlined">
          <Box display="flex" gap={0.5} alignItems="center">
            <Avatar
              alt="EXRA Token"
              src={`/img/assets/EXTRA.svg`}
              sx={{ width: 16, height: 16, fontSize: 10, borderColor: 'transparent' }}
            />
            <Typography fontSize={14} fontWeight={700} noWrap>
              {apr !== undefined ? `${apr} APR` : t('Deposit EXA')}
            </Typography>
          </Box>
        </Button>
      </a>
    </Tooltip>
  );
};

export default ExtraFinance;
