import React from 'react';
import { Box, Typography } from '@mui/material';

import { useTranslation } from 'react-i18next';
import Image from 'next/image';

function StakedEXASummary() {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={7}>
      <Box>
        <Typography variant="h6">{t('Total Exa Staked')}</Typography>
        <Box display="flex" gap={1}>
          <Typography fontSize={32} fontWeight={500}>
            {t('$0.00')}
          </Typography>
          <Typography fontSize={32} fontWeight={500} color="#B4BABF">
            {t('EXA')}
          </Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="h6">{t('Estmated APR')}</Typography>
        <Box display="flex" gap={1}>
          <Typography fontSize={32} fontWeight={500}>
            {t('0.00%')}
          </Typography>
          <Image
            src={`/img/assets/EXA.svg`}
            alt={'EXA'}
            width={32}
            height={32}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </Box>
      </Box>
      <Box>
        <Typography variant="h6">{t('Total Fees Shared')}</Typography>
        <Box display="flex" gap={1}>
          <Typography fontSize={32} fontWeight={500}>
            {t('0.00')}
          </Typography>
          <Typography fontSize={32} fontWeight={500} color="#B4BABF">
            {t('USD')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(StakedEXASummary);
