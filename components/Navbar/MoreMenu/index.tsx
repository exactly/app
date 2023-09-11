import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Box, Typography, popoverClasses, Menu, MenuItem, Button } from '@mui/material';
import Link from 'next/link';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';

import useRouter from 'hooks/useRouter';

type Props = {
  options: {
    pathname: string;
    name: string;
    icon: React.ReactElement;
    isNew?: boolean;
  }[];
};

function MoreMenu({ options }: Props) {
  const { t } = useTranslation();
  const { pathname: currentPathname, query } = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currTimeout, setCurrTimeout] = useState<ReturnType<typeof setTimeout>>();
  const { palette } = useTheme();

  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (anchorEl !== event.currentTarget) {
        setAnchorEl(event.currentTarget);
      }
    },
    [anchorEl],
  );
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);

  const handleOnHover = useCallback(() => clearTimeout(currTimeout), [currTimeout]);
  const handleCloseHover = useCallback(() => setCurrTimeout(setTimeout(closeMenu, 300)), [closeMenu, setCurrTimeout]);

  return (
    <>
      <Button
        variant="text"
        onMouseOver={openMenu}
        onMouseLeave={handleCloseHover}
        sx={{
          pr: '4px',
          pl: '6px',
          minWidth: { xs: '60px', sm: '110px' },
          borderRadius: '32px',
          bgcolor: 'primary',
          '&:hover': {
            bgcolor: 'primary',
            filter: 'brightness(1.1)',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5}>
          <MoreHorizRoundedIcon sx={{ fontSize: 14 }} />
          <Typography fontWeight={700} fontSize={14}>
            {t('More')}
          </Typography>
          {anchorEl ? (
            <ExpandLessIcon sx={{ fontSize: 14, my: 'auto' }} fontSize="small" />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 14, my: 'auto' }} fontSize="small" />
          )}
        </Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        MenuListProps={{
          onMouseEnter: handleOnHover,
          onMouseLeave: handleCloseHover,
          style: { pointerEvents: 'auto' },
        }}
        slotProps={{
          paper: {
            sx: {
              marginTop: '8px',
              padding: '0px 8px',
              boxShadow: ({ palette: _palette }) =>
                _palette.mode === 'light' ? '0px 4px 10px rgba(97, 102, 107, 0.1)' : '',
              borderRadius: '8px',
              minWidth: '270px',
            },
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
        {options.map(({ pathname, name, icon, isNew }) => (
          <MenuItem
            key={`more-menu-link-${pathname}`}
            value={pathname}
            onClick={() => {}}
            selected={currentPathname === pathname}
            tabIndex={-1}
            sx={{
              bgcolor: currentPathname === pathname ? 'grey.100' : 'transparent',
              p: 1,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'figma.grey.100',
              },
              '&:not(:last-of-type)': { mb: 0.5 },
              '&.Mui-selected': {
                backgroundColor: 'grey.100',
                '&:hover': {
                  backgroundColor: 'figma.grey.100',
                },
                '&.Mui-focusVisible': { backgroundColor: 'grey.100' },
              },
              '&.Mui-focusVisible': { backgroundColor: 'transparent' },
            }}
          >
            <Link href={{ pathname, query }} style={{ width: '100%' }}>
              <Box display="flex" alignItems="center" my="auto" px={1} gap={1.5}>
                {React.cloneElement(icon, {
                  sx: {
                    fontSize: '22px',
                    my: 'auto',
                    fill: currentPathname === pathname ? palette.blue : palette.figma.grey[700],
                  },
                })}
                <Typography fontSize="14px" fontWeight={700} flex={1}>
                  {name}
                </Typography>
                {isNew && (
                  <Typography
                    fontSize={11}
                    fontWeight={700}
                    color="white"
                    sx={{ background: palette.green, borderRadius: '4px', px: 0.5, textTransform: 'uppercase' }}
                  >
                    {t('New')}
                  </Typography>
                )}
              </Box>
            </Link>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default React.memo(MoreMenu);
