import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PoolItemInfo, { PoolItemInfoProps } from './PoolItemInfo';

type PoolHeaderInfoProps = {
  title: string;
  itemsInfo: PoolItemInfoProps[];
};

const PoolHeaderInfo: FC<PoolHeaderInfoProps> = ({ title, itemsInfo }) => {
  return (
    <Grid container>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Grid item container spacing={4}>
        {itemsInfo.map(({ label, value, underLabel }) => (
          <PoolItemInfo key={label} label={label} value={value} underLabel={underLabel} />
        ))}
      </Grid>
    </Grid>
  );
};

export default PoolHeaderInfo;
