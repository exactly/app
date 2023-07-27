import React, { FC } from 'react';
import { Avatar, Box, Button, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { optimism } from 'wagmi/chains';
import { useWeb3 } from 'hooks/useWeb3';
import useVelo from 'hooks/useVelo';

type VelodromeProps = {
  onClick: () => void;
};

const Velodrome: FC<VelodromeProps> = ({ onClick }) => {
  const { t } = useTranslation();
  const { chain } = useWeb3();
  const { poolAPR } = useVelo();

  if (chain.id !== optimism.id) {
    return null;
  }

  return (
    <Tooltip title={t('Stake EXA at Velodrome')} arrow placement="bottom">
      <Button variant="outlined" onClick={onClick}>
        <Box display="flex" gap={0.5} alignItems="center">
          <Avatar
            alt="Velodrome Token"
            src={`/img/assets/VELO.svg`}
            sx={{ width: 16, height: 16, fontSize: 10, borderColor: 'transparent' }}
          />
          <Typography fontSize={14} fontWeight={700} noWrap>
            {poolAPR ? poolAPR : t('Stake EXA')}
          </Typography>
        </Box>
      </Button>
    </Tooltip>
  );
};

export default Velodrome;
