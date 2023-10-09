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
        minHeight: 420,
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
      <Box height={152} bgcolor="#F9FAFB">
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5, zIndex: 1 }}>
          {source && (
            <Typography
              fontSize={11}
              fontWeight={700}
              color="white"
              sx={{
                background: '#0E0E0E',
                borderRadius: '4px',
                px: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {source === 'exactly' ? t('Exactly Protocol') : t('Third-Party')}
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
        {imgPath && (
          <Box position="relative" width="100%" height={152}>
            <Image src={imgPath} alt="" layout="fill" objectFit="contain" />
          </Box>
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        p={4}
        gap={3}
        justifyContent="space-between"
        minHeight={286}
        height="100%"
      >
        <Box display="flex" flexDirection="column" gap={2.2}>
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
            {tags?.map((label, i) => <StrategyTag key={`${label.text}-${i}`} {...label} />)}
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
