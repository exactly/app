import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ItemInfo, { ItemInfoProps } from './ItemInfo';

type HeaderInfoProps = {
  title: string;
  itemsInfo: ItemInfoProps[];
  actions?: JSX.Element;
};

const HeaderInfo: FC<HeaderInfoProps> = ({ title, itemsInfo, actions }) => {
  return (
    <>
      <Grid item mb={1} sx={{ alignSelf: 'center', marginRight: '20px' }}>
        <Typography variant="h2">{title}</Typography>
      </Grid>
      {Boolean(actions) && (
        <Grid mb={4} container>
          {actions}
        </Grid>
      )}
      <Grid item container mb={2} spacing={4}>
        {itemsInfo.map(({ label, value, underLabel }) => (
          <ItemInfo key={label.trim()} label={label} value={value} underLabel={underLabel} />
        ))}
      </Grid>
    </>
  );
};

export default HeaderInfo;
