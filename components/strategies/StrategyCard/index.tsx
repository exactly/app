import React, { type PropsWithChildren } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type Props = PropsWithChildren<{
  title: string;
  description: string;
  tags: ('advanced' | 'basic' | 'new')[];
}>;

function StrategyCard({ title, description, tags, children }: Props) {
  const { t } = useTranslation();
  return (
    <Card
      sx={{
        height: 258,
        maxWidth: 389,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        borderRadius: '8px',
        padding: '44px 32px 32px 32px',
        boxShadow: '0px 3px 4px 0px rgba(97, 102, 107, 0.1)',
        '&:hover': {
          boxShadow:
            'rgba(0, 0, 0, 0.2) 0px 3px 3px -2px, rgba(0, 0, 0, 0.14) 0px 3px 4px 0px, rgba(0, 0, 0, 0.12) 0px 1px 8px 0px',
        },
      }}
    >
      <Box sx={{ position: 'absolute', top: 0, right: 32, display: 'flex', gap: 0.5 }}>
        {tags
          .filter((tag) => tag !== 'new')
          .map((tag) => (
            <Chip key={tag} gradient="black">
              {tag === 'advanced' ? t('Advanced') : t('Basic')}
            </Chip>
          ))}
        {tags.includes('new') && <Chip gradient="green">{t('New')}</Chip>}
      </Box>
      <Box>
        <Typography variant="h6" component="div" color="grey.900">
          {title}
        </Typography>
        <Typography component="div" mt={2} fontWeight={500} fontSize={14} color="grey.900">
          {description}
        </Typography>
      </Box>
      <Box>{children}</Box>
    </Card>
  );
}

const gradients = {
  green: 'linear-gradient(66.92deg, #00CC68 34.28%, #00CC8F 100%)',
  black: 'linear-gradient(77.86deg, #757A80 9.74%, #0D0E0F 100%)',
} as const;

function Chip({ children, gradient }: PropsWithChildren<{ gradient: 'green' | 'black' }>) {
  return (
    <Box
      sx={{
        width: 'fit-content',
        display: 'flex',
        alignItems: 'center',
        height: 20,
        py: '4px',
        px: '6px',
        borderBottomLeftRadius: '4px',
        borderBottomRightRadius: '4px',
        background: gradients[gradient],
      }}
    >
      <Typography textTransform="uppercase" variant="chip" color="white">
        {children}
      </Typography>
    </Box>
  );
}

export default React.memo(StrategyCard);
