import React, { FC } from 'react';
import { Avatar, AvatarGroup, Box, Button, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useExtra } from 'hooks/useExtra';

const EXTRA_EXA_LENDING_POOL_URL = 'https://app.extrafi.io/lend/EXA';

const ExtraFinance: FC = () => {
  const { t } = useTranslation();
  const { apr, apy } = useExtra();

  return (
    <Tooltip
      title={t('Deposit EXA on Extra Finance and get up to {{apy}} APY', {
        apy,
      })}
      arrow
      placement="bottom"
    >
      <a href={EXTRA_EXA_LENDING_POOL_URL} target="_blank" rel="noreferrer noopener">
        <Button variant="outlined">
          <Box display="flex" gap={0.5} alignItems="center">
            <AvatarGroup
              max={6}
              sx={{ '& .MuiAvatar-root': { width: 18, height: 18, fontSize: 12, borderColor: 'transparent' } }}
            >
              <Avatar
                alt="EXRA Token"
                src={`/img/assets/EXA.svg`}
                sx={{ width: 18, height: 18, fontSize: 10, borderColor: 'transparent' }}
              />
              <Avatar
                alt="EXRA Token"
                src={`/img/assets/EXTRA.svg`}
                sx={{ width: 18, height: 18, fontSize: 10, borderColor: 'transparent' }}
              />
            </AvatarGroup>
            <Typography fontSize={14} fontWeight={700} noWrap>
              {apr !== undefined ? `up to ${apr} APR` : t('Deposit EXA')}
            </Typography>
          </Box>
        </Button>
      </a>
    </Tooltip>
  );
};

export default ExtraFinance;
