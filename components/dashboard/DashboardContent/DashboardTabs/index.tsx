import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

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
      <Box width="100%">
        <TabList
          onChange={(_: React.SyntheticEvent, newTab: string) => setCurrentTab(newTab)}
          aria-label="lab API tabs example"
          TabIndicatorProps={{ sx: { height: '4px', background: '#34C53A' } }}
          textColor="inherit"
          sx={{
            '& button:hover': { backgroundColor: '#5c5a5a', color: 'white' },
            '& button:focus': { backgroundColor: '#0E0E0E', color: 'white' },
            '& button.Mui-selected': { backgroundColor: '#0E0E0E', color: 'white' },
          }}
        >
          {allTabs.map(({ label, value }) => (
            <Tab label={label} value={value} sx={{ paddingX: 5, fontSize: '1.1em' }} key={`tab_${value}`} />
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
