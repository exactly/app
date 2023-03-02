import React, { cloneElement, FC, ReactElement, useCallback, useContext, useMemo, useState } from 'react';

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Menu, MenuItem, popoverClasses, Typography } from '@mui/material';
import { MarketContext, MarketView } from 'contexts/MarketContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Timeout } from 'react-number-format/types/types';
import { SimpleViewIcon, AdvancedViewIcon } from 'components/Icons';

type ViewOption = {
  type: MarketView;
  title: string;
  description: string;
  icon: ReactElement;
};

const SelectMarketsView: FC = () => {
  const { query, pathname: currentPathname } = useRouter();
  const { view, setView } = useContext(MarketContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currTimeout, setCurrTimeout] = useState<Timeout>();

  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (anchorEl !== event.currentTarget) {
        setAnchorEl(event.currentTarget);
      }
    },
    [anchorEl],
  );
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);

  const onSelectType = useCallback(
    (type: MarketView) => {
      setView(type);
      closeMenu();
      clearTimeout(currTimeout);
    },
    [closeMenu, currTimeout, setView],
  );

  const handleOnHover = useCallback(() => clearTimeout(currTimeout), [currTimeout]);
  const handleCloseHover = useCallback(() => setCurrTimeout(setTimeout(closeMenu, 300)), [closeMenu, setCurrTimeout]);

  const views: ViewOption[] = useMemo(
    () => [
      {
        type: 'simple',
        title: 'Simple view',
        description: 'Intuitive and user-friendly interface',
        icon: <SimpleViewIcon />,
      },
      {
        type: 'advanced',
        title: 'Advanced view',
        description: 'An in-depth look at APR values',
        icon: <AdvancedViewIcon />,
      },
    ],
    [],
  );

  return (
    <>
      <Link href={{ pathname: '/', query }} legacyBehavior>
        <Button
          variant={currentPathname === '/' ? 'contained' : 'text'}
          onMouseOver={openMenu}
          onMouseLeave={handleCloseHover}
          sx={{
            pr: '4px',
            pl: '6px',
            minWidth: { xs: '60px', sm: '110px' },
            borderRadius: '32px',
            bgcolor: 'primary',
            color: currentPathname === '/' ? 'white' : 'grey.700',
            '&:hover': {
              bgcolor: 'primary',
              filter: 'brightness(1.1)',
            },
            cursor: 'pointer',
          }}
        >
          <Box display="flex" gap={0.5}>
            <BarChartRoundedIcon sx={{ fontSize: '14px', my: 'auto' }} />
            <Typography fontWeight={700} fontSize={14}>
              Markets
            </Typography>
            {anchorEl ? (
              <ExpandLessIcon sx={{ fontSize: '14px', my: 'auto', color: 'grey.500' }} fontSize="small" />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: '14px', my: 'auto', color: 'grey.500' }} fontSize="small" />
            )}
          </Box>
        </Button>
      </Link>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
          onMouseEnter: handleOnHover,
          onMouseLeave: handleCloseHover,
          style: { pointerEvents: 'auto' },
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
        sx={{
          [`&.${popoverClasses.root}`]: {
            pointerEvents: 'none',
          },
          selected: {
            backgroundColor: 'pink',
          },
        }}
      >
        {views.map(({ type, title, description, icon }) => (
          <MenuItem
            key={`mainnnet_chain_${type}`}
            value={type}
            onClick={() => onSelectType(type)}
            selected={view === type}
            sx={{
              bgcolor: view === type ? 'grey.100' : 'transparent',
              p: 1,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'figma.grey.100',
              },
              '&.Mui-selected': {
                backgroundColor: 'grey.100',
                '&:hover': {
                  backgroundColor: 'figma.grey.100',
                },
                '&.Mui-focusVisible': { backgroundColor: 'grey.100' },
              },
            }}
          >
            <Link href={{ pathname: '/', query }} legacyBehavior>
              <Box display="flex" width="100%" gap={1.5}>
                <Box display="flex" alignItems="center" my="auto" px={1}>
                  {cloneElement(icon, {
                    sx: { fontSize: '22px', my: 'auto', color: view === type ? 'blue' : 'figma.grey.700' },
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
            </Link>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SelectMarketsView;
