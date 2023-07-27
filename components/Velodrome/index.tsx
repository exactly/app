import React, { useMemo } from 'react';
import { Avatar, Box, Button, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAssetPrice } from 'hooks/useSocketAPI';
import { useEXAGaugeRewardRate } from 'hooks/useEXAGauge';
import { useEXAPrice } from 'hooks/useEXA';
import useAccountData from 'hooks/useAccountData';
import { useEXAPoolGetReserves } from 'hooks/useEXAPool';
import { parseEther } from 'viem';
import { optimism } from 'wagmi/chains';
import { WEI_PER_ETHER } from 'utils/const';
import { toPercentage } from 'utils/utils';
import { useWeb3 } from 'hooks/useWeb3';

const Velodrome = () => {
  const { t } = useTranslation();
  const { chain } = useWeb3();
  const velo = useAssetPrice('0x9560e827af36c94d2ac33a39bce1fe78631088db');
  const exa = useEXAPrice();
  const { marketAccount: weth } = useAccountData('WETH');

  const { data: rewardRate } = useEXAGaugeRewardRate();
  const { data: reserves } = useEXAPoolGetReserves();

  const veloAPR = useMemo(() => {
    if (!velo || !exa || !weth || !rewardRate || !reserves) return;

    const veloPrice = parseEther(String(velo.tokenPrice));

    return toPercentage(
      Number(
        (rewardRate * 86_400n * 365n * veloPrice) / ((reserves[0] * exa + reserves[1] * weth.usdPrice) / WEI_PER_ETHER),
      ) / 1e18,
    );
  }, [velo, exa, weth, rewardRate, reserves]);

  if (chain.id !== optimism.id) {
    return null;
  }

  return (
    <Tooltip title={t('Stake EXA at Velodrome')} arrow placement="bottom">
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
              {veloAPR ? veloAPR : t('Stake EXA')}
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
    </Tooltip>
  );
};

export default Velodrome;
