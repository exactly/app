import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { apps } from '.';

type Props = {
  onNextStep: () => void;
  onChange: (i: number) => void;
};

const Apps = ({ onNextStep, onChange }: Props) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography fontSize={24} fontWeight={700} mb={3}>
        {t('Select card provider')}
      </Typography>
      <Typography fontSize={16} fontWeight={500} mb={6}>
        {t('This is the current list of supported providers. Select the one you want to use.')}
      </Typography>
      <List
        sx={({ palette }) => ({
          '& > :last-child': {
            borderBottom: 0,
            marginBottom: 0,
          },
          bgcolor: 'components.bg',
          borderRadius: 2,
          boxShadow: palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 0,
        })}
      >
        {apps().map(({ name, imgURL }, index) => (
          <ListItem
            disablePadding
            key={name}
            onClick={() => {
              onNextStep();
              onChange(index);
            }}
            sx={({ palette }) => ({
              borderBottom: 1,
              borderColor: palette.mode === 'light' ? 'grey.300' : 'grey.200',
            })}
          >
            <ListItemButton sx={{ paddingX: 2.5, paddingY: 2.5 }}>
              <ListItemIcon>
                <Avatar
                  src={imgURL}
                  alt={name}
                  sx={{
                    width: 32,
                    height: 32,
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={name} primaryTypographyProps={{ fontWeight: 400, fontSize: 16 }} />
              <ChevronRight />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Apps;
