import React, { FC } from 'react';
import { Avatar, Box, Button, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useVELOPoolAPR } from 'hooks/useVELO';
import { useModal } from 'contexts/ModalContext';

const Velodrome: FC = () => {
  const { t } = useTranslation();
  const apr = useVELOPoolAPR();
  const { open } = useModal('proto-staker');

  return (
    <Tooltip title={t('Provide EXA liquidity on Velodrome and receive VELO rewards')} arrow placement="bottom">
      <Button variant="outlined" onClick={open}>
        <Box display="flex" gap={0.5} alignItems="center">
          <Avatar
            alt="Velodrome Token"
            src={`/img/assets/VELO.svg`}
            sx={{ width: 16, height: 16, fontSize: 10, borderColor: 'transparent' }}
          />
          <Typography fontSize={14} fontWeight={700} noWrap>
            {apr !== undefined ? `${apr} APR` : t('Supply EXA')}
          </Typography>
        </Box>
      </Button>
    </Tooltip>
  );
};

export default Velodrome;
