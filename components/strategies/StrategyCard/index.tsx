import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import StrategyTag, { StrategyTagProps } from '../StrategyTag';
import Image from 'next/image';

export type Props = {
  title: string;
  description: string;
  button: React.ReactNode;
  tags: StrategyTagProps[];
  imgPath?: string;
  isNew?: boolean;
  source?: 'exactly' | 'third-party';
};

function StrategyCard({ title, description, button, tags, imgPath, isNew, source }: Props) {
  const { t } = useTranslation();
  return (
    <Card
      sx={{
        height: 420,
        maxWidth: 389,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: '8px',
        boxShadow: '0px 3px 4px 0px rgba(97, 102, 107, 0.1)',
        '&:hover': {
          boxShadow:
            'rgba(0, 0, 0, 0.2) 0px 3px 3px -2px, rgba(0, 0, 0, 0.14) 0px 3px 4px 0px, rgba(0, 0, 0, 0.12) 0px 1px 8px 0px',
        },
      }}
    >
      <Box height={152}>
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
          {source && (
            <Typography
              fontSize={11}
              fontWeight={700}
              color="white"
              sx={{
                background: ({ palette }) => palette.primary.main,
                borderRadius: '4px',
                px: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {t(source)}
            </Typography>
          )}
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
        </Box>
        {imgPath && <Image src={imgPath} alt="strategy" width={389} height={152} />}
      </Box>
      <Box display="flex" flexDirection="column" p={4} gap={1} justifyContent="space-between" height={286}>
        <Box display="flex" flexDirection="column" gap={2.2}>
          <Box display="flex" alignItems="center" gap={1}>
            {tags?.map((label, i) => <StrategyTag key={i} {...label} />)}
          </Box>
          <Typography variant="h6" component="div" color="grey.900">
            {title}
          </Typography>
          <Typography component="div" fontWeight={500} fontSize={14} color="grey.900">
            {description}
          </Typography>
        </Box>
        <Box>{button}</Box>
      </Box>
    </Card>
  );
}

export default React.memo(StrategyCard);
