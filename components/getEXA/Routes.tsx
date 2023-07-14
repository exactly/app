import React, { Box, Skeleton } from '@mui/material';
import { useGetEXA } from 'contexts/GetEXAContext';
import { memo } from 'react';
import Route from './Route';

const Routes = () => {
  const { routes } = useGetEXA();

  const fastestRouteId = routes?.sort(
    (r1, r2) => (r1.userTxs[0].serviceTime || 0) - (r2.userTxs[0].serviceTime || 0),
  )[0]?.routeId;

  const bestReturnRouteId = routes?.sort(
    (r1, r2) => Number(r2.toAmount) - r2.totalGasFeesInUsd - (Number(r1.toAmount) - r1.totalGasFeesInUsd),
  )[0]?.routeId;

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {!routes ? (
        <Skeleton height={100} />
      ) : routes.length > 0 ? (
        routes.map((route) => (
          <Route
            key={route.routeId}
            route={route}
            tags={[
              ...(fastestRouteId === route.routeId ? (['fastest'] as const) : []),
              ...(bestReturnRouteId === route.routeId ? (['best return'] as const) : []),
            ]}
          />
        ))
      ) : (
        'no routes'
      )}
    </Box>
  );
};

export default memo(Routes);
