import React, { FC, PropsWithChildren, ReactNode } from 'react';
import { Box, Divider, Typography } from '@mui/material';

type OverviewCardProps = {
  title: string;
  icon: ReactNode;
  total: string;
  subTotal?: ReactNode;
  fixedValue: string;
  floatingValue: string;
  subFixedValue: string;
  subFloatingValue: string;
  viewAll?: boolean;
  actions?: ReactNode;
};

const OverviewCard: FC<PropsWithChildren & OverviewCardProps> = ({
  title,
  icon,
  total,
  subTotal,
  fixedValue,
  floatingValue,
  subFixedValue,
  subFloatingValue,
  viewAll,
  actions,
  children,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p={4}
      gap={4}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="components.bg"
      minHeight="450px"
    >
      <Box display="flex" flexDirection="column" gap={4}>
        <Box display="flex" flexDirection="column" gap={3.5}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.2}>
              {icon}
              <Typography variant="dashboardTitle">{title}</Typography>
            </Box>
            {viewAll && (
              <Typography variant="dashboardMainSubtitle" textTransform="uppercase" sx={{ cursor: 'pointer' }}>
                View All
              </Typography>
            )}
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" flex="nowrap" alignItems="baseline" gap={1}>
              <Typography variant="dashboardOverviewAmount">{total}</Typography>
              {subTotal}
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} borderRadius="4px" sx={{ bgcolor: 'blue' }} />
                  <Typography variant="dashboardMainTitle" fontSize={{ xs: 16, lg: 19 }} fontWeight={600}>
                    {fixedValue}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} sx={{ bgcolor: 'transparent' }} />
                  <Typography variant="dashboardSubtitleNumber">{subFixedValue}</Typography>
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} borderRadius="4px" sx={{ bgcolor: 'green' }} />
                  <Typography variant="dashboardMainTitle" fontSize={{ xs: 16, lg: 19 }} fontWeight={600}>
                    {floatingValue}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={16} height={16} sx={{ bgcolor: 'transparent' }} />
                  <Typography variant="dashboardSubtitleNumber">{subFloatingValue}</Typography>
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
