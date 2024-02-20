import { Box, Typography } from '@mui/material';
import { useGetEXA } from 'contexts/GetEXAContext';
import Image from 'next/image';
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Route as RouteType } from 'types/Bridge';
import formatNumber from 'utils/formatNumber';
import { track } from 'utils/mixpanel';

type Props = {
  route: RouteType;
  tags: ('fastest' | 'best return')[];
};

const Route = ({ route, tags }: Props) => {
  const { userTxs, toAmount, totalGasFeesInUsd, routeId } = route;
  const { route: selectedRoute, setRoute } = useGetEXA();

  const protocol =
    userTxs?.[userTxs.length - 1]?.protocol || userTxs?.[0].steps?.[(userTxs[0]?.stepCount || 0) - 1].protocol;

  const [{ serviceTime }] = userTxs;

  const { t } = useTranslation();

  const isSelected = selectedRoute?.routeId === routeId;

  const handleRouteClick = useCallback(() => {
    setRoute(route);
    track('Option Selected', {
      location: 'Get EXA',
      name: 'route',
      value: protocol?.displayName || 'no option',
      prevValue:
        (
          selectedRoute?.userTxs?.[selectedRoute?.userTxs.length - 1] ||
          selectedRoute?.userTxs?.[0].steps?.[(selectedRoute?.userTxs[0]?.stepCount || 0) - 1]
        )?.protocol?.displayName || 'no option',
    });
  }, [protocol?.displayName, route, selectedRoute, setRoute]);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      border={1}
      borderColor={isSelected ? 'ActiveBorder' : 'grey.200'}
      padding={2}
      borderRadius={1}
      onClick={handleRouteClick}
      sx={{ cursor: 'pointer' }}
    >
      <Image
        src={protocol?.icon || ''}
        alt={protocol?.displayName || ''}
        width={32}
        height={32}
        style={{
          maxWidth: '100%',
          borderRadius: '100%',
        }}
      />
      <Box display="flex" flexDirection="column">
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" gap={0.5}>
            <Typography fontWeight={600}> {protocol?.displayName}</Typography>
            {serviceTime && <Typography fontWeight={400}> ~ {Math.round(serviceTime / 60)} min</Typography>}
          </Box>
          <Box display="flex" gap={1}>
            {tags.map((tag) => (
              <Box
                key={tag}
                width="fit-content"
                display="flex"
                alignItems="center"
                height={16}
                py={0.375}
                px={0.75}
                borderRadius={0.5}
                bgcolor={tag === 'fastest' ? '#33CC59' : '#0095FF'}
              >
                <Typography variant="chip" color="components.bg">
                  {tag === 'fastest' ? t('FASTEST') : t('BEST RETURN')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box display="flex" gap={0.5}>
          <Typography fontSize={12}>
            {t('Est. Output')}: {formatNumber(Number(toAmount) / 1e18)} EXA
          </Typography>
          <Typography fontSize={12}>
            {t('Gas fees')}: ${formatNumber(totalGasFeesInUsd)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(Route);
