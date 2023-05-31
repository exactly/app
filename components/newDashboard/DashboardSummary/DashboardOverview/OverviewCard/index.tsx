import React, { FC, PropsWithChildren, ReactNode, useMemo } from 'react';
import { Box, Divider, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OperationLegend from 'components/common/OperationLegend';

type OverviewCardProps = {
  title: string;
  icon: ReactNode;
  total?: string;
  fixedValue?: string;
  floatingValue?: string;
  subFixedValue?: string;
  subFloatingValue?: string;
  viewAll?: boolean;
  actions?: ReactNode;
  mobileWrap?: boolean;
};

const OverviewCard: FC<PropsWithChildren & OverviewCardProps> = ({
  title,
  icon,
  total,
  fixedValue,
  floatingValue,
  subFixedValue,
  subFloatingValue,
  viewAll,
  actions,
  children,
  mobileWrap,
}) => {
  const { t } = useTranslation();

  const loading = useMemo(() => !fixedValue || !floatingValue, [fixedValue, floatingValue]);
  const empty = useMemo(() => total === '$0.00', [total]);

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
      minHeight={{ xs: '100px', lg: '100%' }}
    >
      <Box display="flex" flexDirection="column" gap={empty ? 0 : 4}>
        <Box display="flex" flexDirection="column" gap={3.5}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.2}>
              {icon}
              <Typography variant="dashboardTitle" textTransform="capitalize">
                {title}
              </Typography>
            </Box>
            {viewAll && (
              <Typography variant="dashboardMainSubtitle" textTransform="uppercase" sx={{ cursor: 'pointer' }}>
                {t('View All')}
              </Typography>
            )}
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {loading ? (
              <Skeleton width={128} height={64} />
            ) : (
              <Typography variant="dashboardOverviewAmount">{total}</Typography>
            )}
            {!empty && (
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Typography variant="h6" fontWeight={600}>
                    {fixedValue}
                  </Typography>
                  <Box display="flex" flexDirection={{ xs: mobileWrap ? 'column' : 'row', lg: 'row' }} gap={0.5}>
                    <Box display="flex" gap={0.5} alignItems="center">
                      <OperationLegend type="fixed" size="medium" />
                      <Typography variant="dashboardSubtitleNumber">{t('fixed')?.toUpperCase()}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {mobileWrap && <Box width={12} height={12} display={{ xs: 'block', lg: 'none' }} />}
                      <Typography variant="dashboardSubtitleNumber">{subFixedValue}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Typography variant="h6" fontWeight={600}>
                    {floatingValue}
                  </Typography>
                  <Box display="flex" flexDirection={{ xs: mobileWrap ? 'column' : 'row', lg: 'row' }} gap={0.5}>
                    <Box display="flex" gap={0.5} alignItems="center">
                      <OperationLegend type="variable" size="medium" />
                      <Typography variant="dashboardSubtitleNumber">{t('variable')?.toUpperCase()}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {mobileWrap && <Box width={12} height={12} display={{ xs: 'block', lg: 'none' }} />}
                      <Typography variant="dashboardSubtitleNumber">{subFloatingValue}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        {children}
      </Box>
      {actions}
    </Box>
  );
};

export default OverviewCard;
