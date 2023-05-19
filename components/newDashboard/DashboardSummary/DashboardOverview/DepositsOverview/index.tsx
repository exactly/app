import React from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import ButtonWithDropdown from 'components/common/ButtonWithDropdown';
import { DepositIcon } from 'components/Icons';
import DualProgressBarPosition from '../DualProgressBarPosition';

const DepositsOverview = () => {
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
      minHeight="400px"
    >
      <Box display="flex" flexDirection="column" gap={3.5}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.2}>
            <DepositIcon sx={{ fontSize: 12 }} />
            <Typography variant="dashboardTitle">Your Deposits</Typography>
          </Box>
          <Typography variant="dashboardMainSubtitle" textTransform="uppercase" sx={{ cursor: 'pointer' }}>
            View All
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography variant="dashboardOverviewAmount">$560,432.51</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" gap={1}>
                <Box width={16} height={16} borderRadius="4px" sx={{ bgcolor: 'blue' }} />
                <Typography variant="dashboardMainTitle" fontWeight={600}>
                  $134,003.41
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box width={16} height={16} sx={{ bgcolor: 'transparent' }} />
                <Typography variant="dashboardSubtitleNumber">23.91%</Typography>
              </Box>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" gap={1}>
                <Box width={16} height={16} borderRadius="4px" sx={{ bgcolor: 'green' }} />
                <Typography variant="dashboardMainTitle" fontWeight={600}>
                  $426,429.10
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box width={16} height={16} sx={{ bgcolor: 'transparent' }} />
                <Typography variant="dashboardSubtitleNumber">76.08%</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" gap={4}>
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Grid display="flex" alignItems="center" justifyContent="center">
            <Grid item xs={2}>
              <Typography variant="dashboardOverviewSubtitle2" textTransform="uppercase">
                DAI
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <DualProgressBarPosition symbol="DAI" />
            </Grid>
            <Grid item xs={2} textAlign="right">
              <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500">
                20.00%
              </Typography>
            </Grid>
          </Grid>
          <Grid display="flex" alignItems="center" justifyContent="center">
            <Grid item xs={2}>
              <Typography variant="dashboardOverviewSubtitle2" textTransform="uppercase">
                USDC
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <DualProgressBarPosition symbol="USDC" />
            </Grid>
            <Grid item xs={2} textAlign="right">
              <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500">
                20.00%
              </Typography>
            </Grid>
          </Grid>

          <Grid display="flex" alignItems="center" justifyContent="center">
            <Grid item xs={2}>
              <Typography variant="dashboardOverviewSubtitle2" textTransform="uppercase">
                ETH
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <DualProgressBarPosition symbol="ETH" />
            </Grid>
            <Grid item xs={2} textAlign="right">
              <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500">
                20.00%
              </Typography>
            </Grid>
          </Grid>

          <Grid display="flex" alignItems="center" justifyContent="center">
            <Grid item xs={2}>
              <Typography variant="dashboardOverviewSubtitle2" textTransform="uppercase">
                WBTC
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <DualProgressBarPosition symbol="WBTC" />
            </Grid>
            <Grid item xs={2} textAlign="right">
              <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500">
                20.00%
              </Typography>
            </Grid>
          </Grid>

          <Grid display="flex" alignItems="center" justifyContent="center">
            <Grid item xs={2}>
              <Typography variant="dashboardOverviewSubtitle2" textTransform="uppercase">
                WSTETH
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <DualProgressBarPosition symbol="WSTETH" />
            </Grid>
            <Grid item xs={2} textAlign="right">
              <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500">
                20.00%
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <ButtonWithDropdown fullWidth>Deposit</ButtonWithDropdown>
          <ButtonWithDropdown fullWidth variant="outlined">
            Withdraw
          </ButtonWithDropdown>
        </Box>
      </Box>
    </Box>
  );
};

export default DepositsOverview;
