import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { globals } from 'styles/theme';

const { maxWidth } = globals;

// const DashboardUserCharts = dynamic(() => import('components/DashboardUserCharts'));
const SmartPoolDashboard = dynamic(() => import('components/SmartPoolDashboard'));
const MaturityPoolDashboard = dynamic(() => import('components/MaturityPoolDashboard'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import { useWeb3Context } from 'contexts/Web3Context';

function DashboardContent() {
  const { walletAddress } = useWeb3Context();

  const allTabs = [
    {
      label: 'Your Deposits',
      value: 'deposit',
    },
    {
      label: 'Your Borrows',
      value: 'borrow',
    },
  ];

  const [tabValue, setTabValue] = useState<string>(allTabs[0].value);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Grid container sx={{ maxWidth: maxWidth }} mx="auto" mt={5}>
      <TabContext value={tabValue}>
        <Box width="100%">
          <TabList
            onChange={handleChange}
            aria-label="lab API tabs example"
            TabIndicatorProps={{ sx: { height: '4px', background: '#34C53A' } }}
            textColor="inherit"
            sx={{
              '& button:hover': { backgroundColor: '#5c5a5a', color: 'white' },
              '& button:focus': { backgroundColor: '#0E0E0E', color: 'white' },
              '& button.Mui-selected': { backgroundColor: '#0E0E0E', color: 'white' },
            }}
          >
            {allTabs.map((tab) => (
              <Tab
                label={tab.label}
                value={tab.value}
                sx={{ paddingX: 5, fontSize: '1.1em' }}
                key={`tab_${tab.value}`}
              />
            ))}
          </TabList>
          <Box sx={{ borderBottom: 4, borderColor: 'divider', marginTop: '-4px' }} width="100%" />
        </Box>
        {allTabs.map((tab) => (
          <TabPanel value={tab.value} sx={{ width: '100%', padding: 0 }} key={tab.value}>
            {walletAddress ? (
              <>
                <SmartPoolDashboard tab={tab} />
                <MaturityPoolDashboard tab={tab} />
              </>
            ) : (
              <EmptyState />
            )}
          </TabPanel>
        ))}
      </TabContext>
    </Grid>
  );
}

export default DashboardContent;
