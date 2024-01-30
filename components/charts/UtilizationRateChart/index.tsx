import React, { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Typography, Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

import useUtilizationRate, { useCurrentUtilizationRate } from 'hooks/useUtilizationRate';
import LoadingChart from '../LoadingChart';
import { formatEther } from 'viem';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import { WEI_PER_ETHER } from 'utils/const';
import { useFloatingBalances } from 'hooks/useFloatingBalances';
import { useFixedBalances } from 'hooks/useFixedBalances';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
type Props = {
  type: 'floating' | 'fixed';
  symbol: string;
};

const scalePower = 580;
const scaleFunction = (x: number) => (scalePower ** x - 1) / (scalePower - 1);
const colorscale = [...Array(60)].map(
  (_, i, { length }) =>
    [
      i === length - 1 ? 1 : scaleFunction(i / (length - 1)) * 0.5,
      `hsl(${360 * (1 - (i === length - 1 ? 1 : i / (length - 1)))} 100% 50%)`,
    ] satisfies [number, string],
);

function UtilizationRateChart({ type, symbol }: Props) {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const { data, loading } = useUtilizationRate(symbol, 0n, 95n * 10n ** 16n);
  const { borrowAPR } = useFloatingPoolAPR(symbol);
  const currentUtilization = useCurrentUtilizationRate('floating', symbol);
  const { floatingDeposits, floatingBorrows, backupBorrows } = useFloatingBalances(symbol);
  const { fixedDeposits } = useFixedBalances(symbol);
  const ref = useRef<HTMLDivElement>(null);

  const globalUtilization = useCallback(() => {
    const globalUti =
      backupBorrows !== undefined &&
      floatingBorrows !== undefined &&
      floatingDeposits !== undefined &&
      fixedDeposits !== undefined &&
      floatingDeposits + fixedDeposits > 0n
        ? Number(((floatingBorrows + backupBorrows) * WEI_PER_ETHER) / (floatingDeposits + fixedDeposits)) / 1e18
        : 0;

    return globalUti;
  }, [backupBorrows, fixedDeposits, floatingBorrows, floatingDeposits]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {type === 'floating'
            ? t('Variable APR, Utilization and Global Utilization')
            : t('Utilization Rates (Fixed Rate Pools)')}
        </Typography>
      </Box>
      <Box ref={ref} display="flex" alignSelf="center" width="100%" sx={{ height: 700 }}>
        {loading || !data || !borrowAPR || !currentUtilization ? (
          <LoadingChart />
        ) : (
          <Plot
            data={[
              {
                x: data[0],
                y: data[1],
                z: data[2],
                type: 'surface',
                opacity: 0.8,
                colorscale,
                colorbar: {
                  tickfont: { family: 'Inter, sans-serif', size: 11, color: palette.text.primary },
                  outlinecolor: palette.text.primary,
                  outlinewidth: 0.5,
                  x: 0.89,
                  y: 0.5,
                  len: 0.8,
                  thickness: 11,
                  tickformat: '.0%',
                  xanchor: 'left',
                  yanchor: 'middle',
                },
                lighting: { ambient: 1, diffuse: 0, specular: 0, fresnel: 0 },
                contours: {
                  // @ts-expect-error -- missing in types
                  x: { color: palette.text.primary, highlightcolor: palette.text.primary },
                  y: { color: palette.text.primary, highlightcolor: palette.text.primary },
                  z: { color: palette.text.primary, highlightcolor: palette.text.primary },
                },
                hovertemplate: `<b>Variable Utilization: %{x}<br>Global Utilization: %{y}<br>Variable APR: %{z:.2%}</b><extra></extra>`,
              },
              {
                type: 'scatter3d',
                mode: 'markers',
                x: [formatEther(currentUtilization[0].utilization)],
                y: [globalUtilization()],
                z: [borrowAPR],
                marker: { symbol: 'cross', size: 8, color: palette.text.primary },
                hovertemplate:
                  '<b>Variable Utilization: %{x:.2%}<br>Global Utilization: %{y:.2%}<br>Variable APR: %{z:.2%}<br>Current</b><extra></extra>',
              },
            ]}
            config={{ displayModeBar: false, responsive: true, scrollZoom: false }}
            layout={{
              paper_bgcolor: 'transparent',
              scene: {
                xaxis: {
                  title: 'Variable Utilization',
                  tickformat: '.0%',
                  titlefont: { family: 'Inter, sans-serif', size: 14, color: palette.text.primary },
                  tickfont: { family: 'Inter, sans-serif', size: 11, color: palette.text.primary },
                },
                yaxis: {
                  title: 'Global Utilization',
                  tickformat: '.0%',
                  titlefont: { family: 'Inter, sans-serif', size: 14, color: palette.text.primary },
                  tickfont: { family: 'Inter, sans-serif', size: 11, color: palette.text.primary },
                },
                zaxis: {
                  title: 'Variable APR',
                  tickformat: '.0%',
                  titlefont: { family: 'Inter, sans-serif', size: 14, color: palette.text.primary },
                  tickfont: { family: 'Inter, sans-serif', size: 11, color: palette.text.primary },
                },
                camera: {
                  eye: { x: 1, y: -1, z: 1 },
                  // @ts-expect-error -- missing in types
                  projection: { type: 'orthographic' },
                },
              },
              autosize: true,
              width: ref.current?.clientWidth ?? 500,
              height: ref.current?.clientHeight ?? 500,
              margin: { l: 0, r: 0, b: 0, t: 0 },
              hoverlabel: {
                align: 'right',
                bgcolor: palette.grey[100],
                bordercolor: palette.text.primary,
                font: { family: 'Inter, sans-serif', size: 13, color: palette.text.primary },
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default React.memo(UtilizationRateChart);
