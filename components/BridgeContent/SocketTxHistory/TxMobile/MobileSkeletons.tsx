import React from 'react';

import { Box, Skeleton } from '@mui/material';

const MobileSkeleton = () => (
  <Box display={'flex'} border={1} borderColor={'grey.200'} borderRadius={'4px'} padding={'16px'} alignItems={'center'}>
    <Box gap={'8px'} flexDirection={'column'} display={'flex'}>
      <Box display={'flex'} alignItems={'center'} gap={'4px'}>
        <Skeleton
          width={18}
          height={28}
          style={{
            maxWidth: '100%',
            borderRadius: '100%',
          }}
        />{' '}
        <Skeleton width={100} />
      </Box>
      <Box display={'flex'} alignItems={'center'} gap={'4px'}>
        <Skeleton
          width={18}
          height={28}
          style={{
            maxWidth: '100%',
            borderRadius: '100%',
          }}
        />
        <Skeleton width={100} />
        <Skeleton width={100} />
      </Box>
    </Box>
    <Box marginLeft={'auto'}>
      <Skeleton width={24} height={40} style={{ borderRadius: '100%' }} />
    </Box>
  </Box>
);

const MobileSkeletons = () => (
  <>
    <MobileSkeleton />
    <MobileSkeleton />
    <MobileSkeleton />
    <MobileSkeleton />
  </>
);

export default MobileSkeletons;
