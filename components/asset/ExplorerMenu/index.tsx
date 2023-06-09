import React, { FC } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Button, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import LinkIcon from '@mui/icons-material/Link';
import { useTranslation } from 'react-i18next';
import useEtherscanLink from 'hooks/useEtherscanLink';
import { Address } from 'viem';

type Props = {
  symbol: string;
  assetAddress: Address;
  eMarketAddress: Address;
  rateModelAddress: Address;
  exaToken: string;
};

const ExplorerMenu: FC<Props> = ({ symbol, assetAddress, eMarketAddress, rateModelAddress, exaToken }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { address } = useEtherscanLink();

  return (
    <>
      <Button
        id="view-contracts-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{ bgcolor: palette.mode === 'light' ? 'figma.grey.100' : 'grey.100', py: 0.5, px: 1, height: 'auto' }}
      >
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography
            fontSize={10}
            fontWeight={500}
            fontFamily="IBM Plex Mono"
            color={palette.mode === 'light' ? 'figma.grey.600' : 'grey.900'}
            textTransform="uppercase"
          >
            {t('View on Etherscan')}
          </Typography>
          <OpenInNewIcon
            sx={{
              height: '10px',
              width: '10px',
              color: palette.mode === 'light' ? 'figma.grey.600' : 'grey.900',
            }}
          />
        </Box>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'view-contracts-button',
        }}
        PaperProps={{
          style: {
            marginTop: '8px',
            padding: '0 4px 4px 4px',
            boxShadow: '0px 4px 12px rgba(175, 177, 182, 0.2)',
            borderRadius: 16,
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <a href={address(assetAddress)} target="_blank" rel="noopener noreferrer">
          <MenuItem>
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={symbol}
              width={20}
              height={20}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Box ml={1}>{symbol}</Box>
          </MenuItem>
        </a>

        <a href={address(eMarketAddress)} target="_blank" rel="noopener noreferrer">
          <MenuItem>
            <Image
              src={`/img/exaTokens/exa${symbol}.svg`}
              alt={symbol}
              width={20}
              height={20}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Box ml={1}>{exaToken}</Box>
          </MenuItem>
        </a>

        <a href={address(rateModelAddress)} target="_blank" rel="noopener noreferrer">
          <MenuItem>
            <LinkIcon fontSize="small" />
            <Box ml={1}>{t('Interest Rate Model')}</Box>
          </MenuItem>
        </a>
      </Menu>
    </>
  );
};

export default ExplorerMenu;
