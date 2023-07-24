import React, { FC, useCallback, useMemo } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { LoadingButton } from '@mui/lab';

type ClaimableProps = {
  amount?: bigint;
  proof: string[];
};

const Claimable: FC<ClaimableProps> = ({ amount, proof }) => {
  const { t } = useTranslation();
  const parsedAmount = useMemo(() => (amount ? Number(amount) / 1e18 : 0), [amount]);
  const submitClaim = useCallback(() => {
    proof;
    // claim(amount, proof);
  }, [proof]);

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">{t('Claimable')}</Typography>
          <Typography
            fontSize={12}
            fontWeight={700}
            color="grey.100"
            sx={{ px: 0.5, py: 0.1, bgcolor: 'grey.900', borderRadius: '4px' }}
            textTransform="uppercase"
          >
            {t('Coming soon')}
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Image
            src={`/img/assets/EXA.svg`}
            alt=""
            width={24}
            height={24}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <Typography variant="h6">{parsedAmount}</Typography>
        </Box>
      </Box>
      <LoadingButton variant="contained" fullWidth onClick={submitClaim} disabled>
        {t('Claim EXA')}
      </LoadingButton>
      <Typography fontSize={14} color="grey.500">
        {t(
          'When claiming your EXA you are also delegating your voting power to yourself. You can always choose to delegate it to another address later on.',
        )}{' '}
        {/* <a
          href="https://docs.exact.ly/"
          target="_blank"
          rel="noreferrer noopener"
          style={{ textDecoration: 'underline' }}
        >
          {t('Learn more about delegation.')}
        </a> */}
      </Typography>
      <Divider flexItem />
    </Box>
  );
};

export default Claimable;
