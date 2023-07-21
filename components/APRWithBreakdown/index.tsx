import { Avatar, AvatarGroup, Box, Divider, Tooltip, Typography } from '@mui/material';
import React, { FC, PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toPercentage } from 'utils/utils';

type APR = {
  apr?: number;
  symbol: string;
};

type APRWithBreakdownProps = {
  directionMobile?: 'row' | 'row-reverse';
  iconsSize?: number;
  markets: APR[];
  rewards?: APR[];
  natives?: APR[];
};

const APRWithBreakdown: FC<PropsWithChildren & APRWithBreakdownProps> = ({
  directionMobile = 'row-reverse',
  iconsSize = 16,
  children,
  markets,
  rewards = [],
  natives = [],
}) => {
  const symbols = useMemo(
    () => [
      ...markets.map(({ symbol }) => symbol),
      ...rewards.map(({ symbol }) => symbol),
      ...natives.map(({ symbol }) => symbol),
    ],
    [markets, natives, rewards],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" flexDirection={{ xs: directionMobile, md: 'row' }} gap={0.5} alignItems="center">
        <Box>{children}</Box>
        <Tooltip
          title={<APRBreakdown markets={markets} rewards={rewards} natives={natives} />}
          placement="top"
          arrow
          enterTouchDelay={0}
          sx={{ cursor: 'pointer' }}
        >
          <Box>
            <SymbolGroup symbols={symbols} size={iconsSize} />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

const APRBreakdown: FC<Omit<APRWithBreakdownProps, 'totalAPR'>> = ({ markets, rewards = [], natives = [] }) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <APRBreakdownItem title={t('Market APR')} values={markets} />
      {Boolean(rewards.length) && (
        <>
          <Divider flexItem sx={{ mx: 0.5 }} />
          <APRBreakdownItem title={t('Rewards APR')} values={rewards} />
        </>
      )}
      {Boolean(natives.length) && (
        <>
          <Divider flexItem sx={{ mx: 0.5 }} />
          <APRBreakdownItem title={t('Native APR')} values={natives} />
        </>
      )}
    </Box>
  );
};

type APRBreakdownItemProps = {
  title: string;
  values: APR[];
};

const APRBreakdownItem: FC<APRBreakdownItemProps> = ({ title, values }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="left" px={0.5} gap={1}>
      <Box display="flex" alignItems="center">
        <Typography fontFamily="IBM Plex Mono" fontWeight={600} fontSize={10} color="figma.grey.500">
          {title.toUpperCase()}
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column" gap={1}>
        {values.map(({ symbol, apr }) => (
          <Box key={`${symbol}${apr}`} display="flex" alignItems="center" gap={0.5}>
            <Typography fontWeight={500} fontSize={14}>
              {apr && apr > 999 ? '∞' : toPercentage(apr)}
            </Typography>
            <SymbolGroup symbols={[symbol]} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

type SymbolGroupProps = {
  symbols?: string[];
  size?: number;
};

const SymbolGroup: FC<SymbolGroupProps> = ({ symbols, size = 16 }) => {
  if (!symbols) return null;

  return (
    <AvatarGroup
      max={6}
      sx={{ '& .MuiAvatar-root': { width: size, height: size, fontSize: 10, borderColor: 'transparent' } }}
    >
      {symbols.map((symbol, i) => (
        <Avatar key={symbol + i} alt={symbol} src={`/img/assets/${symbol}.svg`} />
      ))}
    </AvatarGroup>
  );
};

export default React.memo(APRWithBreakdown);
