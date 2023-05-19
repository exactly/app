import React, { FC, PropsWithChildren, useMemo } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import formatNumber from 'utils/formatNumber';

type OverviewCardProps = {
  title: string;
  icon: React.ReactNode;
  fixedValue: number;
  floatingValue: number;
  actions?: React.ReactNode;
};

const OverviewCard: FC<PropsWithChildren & OverviewCardProps> = ({
  title,
  icon,
  fixedValue,
  floatingValue,
  children,
  actions,
}) => {
  const total = useMemo(() => fixedValue + floatingValue, [fixedValue, floatingValue]);
  const fixedPercentage = useMemo(() => (total ? (fixedValue / total) * 100 : 0).toFixed(2), [fixedValue, total]);
  const floatingPercentage = useMemo(
    () => (total ? (floatingValue / total) * 100 : 0).toFixed(2),
    [floatingValue, total],
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p={4}
      gap={4}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="#FFFFFF"
      minHeight="450px"
    >
      <Box display="flex" flexDirection="column" gap={4}>
        <Box display="flex" flexDirection="column" gap={3.5}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.2}>
              {icon}
              <Typography variant="dashboardTitle">{title}</Typography>
            </Box>
            <Typography variant="dashboardMainSubtitle" textTransform="uppercase" sx={{ cursor: 'pointer' }}>
              View All
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="dashboardOverviewAmount">${formatNumber(total, 'USD', true)}</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} borderRadius="4px" sx={{ bgcolor: 'blue' }} />
                  <Typography variant="dashboardMainTitle" fontWeight={600}>
                    ${formatNumber(fixedValue, 'USD', true)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} sx={{ bgcolor: 'transparent' }} />
                  <Typography variant="dashboardSubtitleNumber">{fixedPercentage}%</Typography>
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} borderRadius="4px" sx={{ bgcolor: 'green' }} />
                  <Typography variant="dashboardMainTitle" fontWeight={600}>
                    ${formatNumber(floatingValue, 'USD', true)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} sx={{ bgcolor: 'transparent' }} />
                  <Typography variant="dashboardSubtitleNumber">{floatingPercentage}%</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        {children}
      </Box>
      {actions}
    </Box>
  );
};

export default OverviewCard;
