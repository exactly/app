import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ItemInfo, { ItemInfoProps } from './ItemInfo';

type HeaderInfoProps = {
  title: string;
  itemsInfo: ItemInfoProps[];
  rightAction?: JSX.Element;
};

const HeaderInfo: FC<HeaderInfoProps> = ({ title, itemsInfo, rightAction }) => {
  return (
    <Grid container>
      <Grid item>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      </Grid>
      {Boolean(rightAction) && (
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'row-reverse',
            flex: 'auto',
            mr: 2,
          }}
        >
          {rightAction}
        </Grid>
      )}
      <Grid item container spacing={4}>
        {itemsInfo.map(({ label, value, underLabel }) => (
          <ItemInfo key={label.trim()} label={label} value={value} underLabel={underLabel} />
        ))}
      </Grid>
    </Grid>
  );
};

export default HeaderInfo;
