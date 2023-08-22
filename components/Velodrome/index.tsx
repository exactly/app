import React, { FC, useCallback } from 'react';
import { Avatar, Box, Button, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useVELOPoolAPR } from 'hooks/useVELO';
import { useModal } from 'contexts/ModalContext';
import { useWeb3 } from 'hooks/useWeb3';

const Velodrome: FC = () => {
  const { t } = useTranslation();
  const apr = useVELOPoolAPR();
  const { open } = useModal('proto-staker');
  const { disableFeature } = useWeb3();

  const onClick = useCallback(() => {
    if (disableFeature) {
      window.open(
        'https://velodrome.finance/deposit?token0=0x1e925de1c68ef83bd98ee3e130ef14a50309c01b&token1=eth',
        '_blank',
        'noreferrer',
      );
      return;
    }
    open();
  }, [disableFeature, open]);

  return (
    <Tooltip title={t('Provide EXA liquidity on Velodrome and receive VELO rewards')} arrow placement="bottom">
      <Button variant="outlined" onClick={onClick}>
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
