import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OperationLegend from 'components/common/OperationLegend';

const LEGENDS = [
  {
    label: 'Fixed Rate',
    type: 'fixed' as const,
  },
  {
    label: 'Variable Rate',
    type: 'variable' as const,
  },
];

const Legends = () => {
  const { t } = useTranslation();

  return (
    <Box display="flex" justifyContent="end" gap={1}>
      {LEGENDS.map(({ label, type }) => (
        <Box display="flex" gap={0.5} alignItems="center" key={`legend ${label}`}>
          <OperationLegend type={type} small hideTooltip />
          <Typography
            fontSize={10}
            lineHeight="13px"
            fontWeight={700}
            fontFamily="IBM Plex Mono"
            textTransform="uppercase"
            color="figma.grey.500"
          >
            {t(label)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Legends;
