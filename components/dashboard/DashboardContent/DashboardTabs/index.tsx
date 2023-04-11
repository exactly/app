import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Typography } from '@mui/material';

type Tab = {
  label: string;
  value: string;
  content: ReactNode;
};

type Props = {
  initialTab: string;
  allTabs: Tab[];
};

function DashboardTabs({ initialTab, allTabs }: Props) {
  const [currentTab, setCurrentTab] = useState<Tab['value']>(initialTab);

  return (
    <TabContext value={currentTab}>
      <Box>
        <TabList
          onChange={(_: React.SyntheticEvent, newTab: string) => setCurrentTab(newTab)}
          TabIndicatorProps={{ sx: { height: 0 } }}
          textColor="inherit"
          sx={{
            '& button:hover': { backgroundColor: '#5c5a5a', color: 'white' },
            '& button:focus': { backgroundColor: '#0E0E0E', color: 'white' },
            '& button.Mui-selected': { backgroundColor: '#0E0E0E', color: 'white' },
          }}
        >
          {allTabs.map(({ label, value }) => (
            <Tab
              data-testid={`tab-${value}`}
              key={`tab_${value}`}
              value={value}
              sx={{ paddingX: 2.5, textTransform: 'none' }}
              label={
                <Typography fontWeight={700} fontSize="14px">
                  {label}
                </Typography>
              }
            />
          ))}
        </TabList>
        <Box sx={{ borderBottom: 4, borderColor: 'divider', marginTop: '-4px' }} width="100%" />
      </Box>
      {allTabs.map(({ content, value }) => (
        <TabPanel value={value} sx={{ width: '100%', padding: 0 }} key={value}>
          {content}
        </TabPanel>
      ))}
    </TabContext>
  );
}

export default DashboardTabs;
