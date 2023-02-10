import React, { cloneElement, FC, ReactElement, useCallback, useContext, useMemo, useState } from 'react';

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import ViewCompactOutlinedIcon from '@mui/icons-material/ViewCompactOutlined';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
// import { globals } from 'styles/theme';
import { MarketContext, MarketView } from 'contexts/MarketContext';
// const { onlyDesktop } = globals; //TODO: add mobile support

type ViewOption = {
  type: MarketView;
  title: string;
  description: string;
  icon: ReactElement;
};

const SelectView: FC = () => {
  const { view, setView } = useContext(MarketContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget),
    [setAnchorEl],
  );
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);
  const onSelectType = useCallback(
    (type: MarketView) => {
      setView(type);
      closeMenu();
    },
    [closeMenu, setView],
  );

  const views: ViewOption[] = useMemo(
    () => [
      {
        type: 'simple',
        title: 'Simple view',
        description: 'Intuitive and user-friendly interface',
        icon: <ViewAgendaOutlinedIcon />,
      },
      {
        type: 'advanced',
        title: 'Advanced view',
        description: 'An in-depth look at APR values',
        icon: <ViewCompactOutlinedIcon />,
      },
    ],
    [],
  );

  return (
    <>
      <Button
        variant="contained"
        onClick={openMenu}
        sx={{
          pr: '2px',
          pl: '6px',
          minWidth: { xs: '60px', sm: '110px' },
          borderRadius: '32px',
          bgcolor: 'primary',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary',
            filter: 'brightness(1.1)',
          },
        }}
      >
        <Box display="flex" gap={0.5}>
          <BarChartRoundedIcon sx={{ fontSize: '14px', my: 'auto' }} />
          <Typography fontWeight={700} fontSize={14}>
            Market
          </Typography>
          {anchorEl ? (
            <ExpandLessIcon sx={{ fontSize: '14px', my: 'auto', color: 'grey.500' }} fontSize="small" />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: '14px', my: 'auto', color: 'grey.500' }} fontSize="small" />
          )}
        </Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          style: {
            marginTop: '8px',
            padding: '0px 8px',
            boxShadow: '0px 4px 10px rgba(97, 102, 107, 0.1)',
            borderRadius: '8px',
            minWidth: '270px',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {views.map(({ type, title, description, icon }) => (
          <MenuItem
            key={`mainnnet_chain_${type}`}
            value={type}
            onClick={() => onSelectType(type)}
            sx={{ bgcolor: view === type ? 'grey.100' : 'transparent', p: 1, borderRadius: '4px' }}
          >
            <Box display="flex" width="100%" gap={1.5}>
              <Box my="auto" px={1}>
                {cloneElement(icon, {
                  sx: { fontSize: '24px', my: 'auto', color: view === type ? 'blue' : 'figma.grey.700' },
                })}
              </Box>
              <Box display="flex" flexDirection="column" justifyContent="left">
                <Typography fontSize="14px" fontWeight={700}>
                  {title}
                </Typography>
                <Typography fontSize="13px" fontWeight={500} color="figma.grey.600">
                  {description}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SelectView;
