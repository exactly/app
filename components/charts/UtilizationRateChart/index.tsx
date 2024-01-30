import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

import useUtilizationRate from 'hooks/useUtilizationRate';
import LoadingChart from '../LoadingChart';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

function UtilizationRateChart({ type, symbol }: Props) {
  const { t } = useTranslation();

  const { data, loading } = useUtilizationRate(symbol);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {type === 'floating' ? t('Utilization Rate (Variable Rate Pool)') : t('Utilization Rates (Fixed Rate Pools)')}
        </Typography>
      </Box>
      <Box ref={ref} sx={{ height: 250, width: 572 }}>
        {loading || !data ? (
          <LoadingChart />
        ) : (
          <Plot
            data={[{ x: data[0], y: data[1], z: data[2], type: 'surface' as const }]}
            config={{ displayModeBar: false }}
            layout={{
              scene: {
                xaxis: { title: 'Utilization' },
                yaxis: { title: 'Global Utilization' },
                zaxis: { title: 'APR' },
                camera: { eye: { x: -2, y: -2, z: 1 } },
              },
              autosize: true,
              width: ref.current?.clientWidth ?? 500,
              height: ref.current?.clientHeight ?? 500,
              margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default React.memo(UtilizationRateChart);
