import { Box, Button, Divider, LinearProgress, Typography, linearProgressClasses, styled } from '@mui/material';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'barColor',
})<{ barColor: string }>(({ theme, barColor }) => ({
  height: 8,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[100],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: barColor,
  },
}));

type ActiveStreamProps = {
  elapsed: number;
  duration: number;
  vested: bigint;
  claimed: bigint;
  reserved: bigint;
};

const ActiveStream: FC<ActiveStreamProps> = ({ elapsed, duration, vested, claimed, reserved }) => {
  const { t } = useTranslation();

  const progress = useMemo(() => {
    if (elapsed >= duration || duration === 0) return 100;
    return (elapsed / duration) * 100;
  }, [elapsed, duration]);

  return (
    <Box display="flex" flexDirection="column" gap={4} px={4} py={3.5} pb={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={3}>
        <Box display="flex" alignItems="center" gap={3}>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={14} fontWeight={700}>
              {t('esEXA Vested')}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Image
                src={`/img/assets/EXA.svg`}
                alt="EXA"
                width={20}
                height={20}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6" fontWeight={400}>
                {formatNumber(Number(vested) / 1e18)}
              </Typography>
            </Box>
          </Box>
          <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={14} fontWeight={700}>
              {t('Claimed EXA')}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Image
                src={`/img/assets/EXA.svg`}
                alt="EXA"
                width={20}
                height={20}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="h6" fontWeight={400}>
                {formatNumber(Number(claimed) / 1e18)}
              </Typography>
              <Typography fontSize={14} color="grey.400">
                {`/ ${formatNumber(Number(vested + reserved) / 1e18)}`}
              </Typography>
            </Box>
          </Box>
          <Divider orientation="vertical" sx={{ borderColor: 'grey.200', my: 0.6 }} flexItem />
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography fontSize={14} fontWeight={700}>
              {t('Vesting Period')}
            </Typography>
            <Typography variant="h6" fontWeight={400}>
              {t('{{duration}} days left', { duration })}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Button variant="outlined">{t('View NFT')}</Button>
          <Button variant="contained">{t('Claim EXA')}</Button>
        </Box>
      </Box>
      <StyledLinearProgress variant="determinate" value={progress} barColor="primary" />
    </Box>
  );
};

export default React.memo(ActiveStream);
