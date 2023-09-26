import { Box, Grid, Typography } from '@mui/material';
import React, { FC } from 'react';
import StrategyTag, { StrategyTagProps } from '../StrategyTag';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

type Props = {
  title: string;
  description: string;
  button: React.ReactNode;
  tags: StrategyTagProps[];
  imgPath?: string;
  isNew?: boolean;
};

const StrategyRowCard: FC<Props> = ({ title, description, button, tags, imgPath, isNew }) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={3} p={3}>
      <Box display="flex" alignItems="center" gap={1}>
        {isNew && (
          <Typography
            fontSize={11}
            fontWeight={700}
            color="white"
            sx={{
              background: ({ palette }) => palette.green,
              borderRadius: '4px',
              px: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {t('New')}
          </Typography>
        )}
        {imgPath && (
          <Image src={imgPath} alt="strategy" width={24} height={24} style={{ maxWidth: '100%', height: 'auto' }} />
        )}
        <Typography component="h3" fontSize={16} fontWeight={700}>
          {title}
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={5} md={5} lg={5}>
          <Typography>{description}</Typography>
        </Grid>
        <Grid item xs={12} sm={4} md={4} lg={5}>
          <Box
            display="flex"
            flexWrap="wrap"
            justifyContent={{ xs: 'start', md: 'center' }}
            alignItems="center"
            gap={1}
          >
            {tags?.map((label, i) => <StrategyTag key={i} {...label} />)}
          </Box>
        </Grid>
        <Grid item xs={12} sm={3} md={3} lg={2}>
          <Box display="flex" justifyContent="end" maxWidth={{ xs: '100%', sm: 168 }} width="100%">
            {button}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default React.memo(StrategyRowCard);
