import React from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { getAddressEtherscanUrl, Network } from 'utils/network';
import Image from 'next/image';

type Props = {
  symbol: string;
  networkName: Network;
  assetAddress: string;
  eMarketAddress?: string;
  rateModelAddress?: string;
};

function ExplorerMenu({ symbol, networkName, assetAddress, eMarketAddress, rateModelAddress }: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="View Token Contracts" placement="top" arrow>
        <IconButton
          size="small"
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <OpenInNewIcon sx={{ alignSelf: 'center', height: '1.1rem', width: '1.1rem', color: 'black' }} />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          style: {
            padding: '0 4px 4px 4px',
            boxShadow: '#A7A7A7 0px 0px 2px 0px',
            borderRadius: '2px',
          },
        }}
      >
        <Box px={2} py={1}>
          <Typography variant="subtitle1" sx={{ color: 'grey.400' }}>
            View in etherscan
          </Typography>
        </Box>
        <MenuItem>
          <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={20} height={20} />
          <Box ml={1}>
            <a href={getAddressEtherscanUrl(networkName, assetAddress)} target="_blank" rel="noopener noreferrer">
              {symbol}
            </a>
          </Box>
        </MenuItem>
        <MenuItem>
          <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={20} height={20} />
          <Box ml={1}>
            <a href={getAddressEtherscanUrl(networkName, eMarketAddress)} target="_blank" rel="noopener noreferrer">
              {`e${symbol}`}
            </a>
          </Box>
        </MenuItem>
        <MenuItem>
          <Image src={`/img/assets/WETH.svg`} alt={symbol} width={20} height={20} />
          <Box ml={1}>
            <a href={getAddressEtherscanUrl(networkName, rateModelAddress)} target="_blank" rel="noopener noreferrer">
              Interest Rate Model
            </a>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}

export default ExplorerMenu;
