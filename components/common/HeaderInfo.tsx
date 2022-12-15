import React, { FC } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ItemInfo, { ItemInfoProps } from './ItemInfo';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
type HeaderInfoProps = {
  title: string;
  itemsInfo: ItemInfoProps[];
  variant?:
    | 'h2'
    | 'button'
    | 'caption'
    | 'h1'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'inherit'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'overline'
    | undefined;
  shadow?: boolean;
};

const HeaderInfo: FC<HeaderInfoProps> = ({ title, itemsInfo, variant = 'h6', shadow = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid
      mx={isMobile ? 1 : 0}
      sx={{ bgcolor: 'white' }}
      width="100%"
      p={isMobile ? '16px' : '24px'}
      boxShadow={shadow ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : ''}
    >
      <Grid item mb="12px">
        <Typography variant={variant}>{title}</Typography>
      </Grid>
      <Grid item container spacing={isMobile ? 2 : 4}>
        {itemsInfo.map(({ label, value, underLabel, tooltipTitle }) => (
          <ItemInfo
            key={label.trim()}
            label={label}
            value={value}
            underLabel={underLabel}
            tooltipTitle={tooltipTitle}
          />
        ))}
      </Grid>
    </Grid>
  );
};

export default HeaderInfo;
