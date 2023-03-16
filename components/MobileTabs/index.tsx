import React, { ReactNode, useState } from 'react';
import { Box, Button } from '@mui/material';

export type MobileTab = {
  title: string;
  content: ReactNode;
};

type Props = {
  tabs: MobileTab[];
};

function MobileTabs({ tabs }: Props) {
  const [selected, setSelected] = useState<number>(0);

  return (
    <>
      <Box display="flex" justifyContent="center" mb={1}>
        {tabs.map(({ title }, i) => (
          <Button
            key={`mobile-tab-${title}`}
            variant={selected === i ? 'contained' : 'outlined'}
            fullWidth
            sx={{
              borderRadius: i === 0 ? '6px 0px 0px 6px' : i === tabs.length - 1 ? '0px 6px 6px 0px' : 0,
              borderWidth: '1px',
              color: selected === i ? 'white' : 'figma.grey.900',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setSelected(i)}
          >
            {title}
          </Button>
        ))}
      </Box>
      <Box>
        {tabs.map(({ title, content }, i) => selected === i && <Box key={`mobile-content-${title}`}>{content}</Box>)}
      </Box>
    </>
  );
}

export default MobileTabs;
