import React, { FC, useCallback, useMemo } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';
import networkData from 'config/networkData.json' assert { type: 'json' };
import { useWeb3 } from 'hooks/useWeb3';
import LinkIcon from '@mui/icons-material/Link';

type Props = {
  symbol: string;
  assetAddress?: string;
  eMarketAddress?: string;
  rateModelAddress?: string;
  exaToken?: string;
};

const ExplorerMenu: FC<Props> = ({ symbol, assetAddress, eMarketAddress, rateModelAddress, exaToken }) => {
  const { chain } = useWeb3();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const getAddressEtherscanUrl = useCallback(
    (address?: string): string => {
      if (!address || !chain) return '';
      const etherscan = networkData[String(chain?.id) as keyof typeof networkData]?.etherscan;
      return `${etherscan}/address/${address}`;
    },
    [chain],
  );

  const assetEtherscan = useMemo(() => getAddressEtherscanUrl(assetAddress), [assetAddress, getAddressEtherscanUrl]);
  const eMarketEtherscan = useMemo(
    () => getAddressEtherscanUrl(eMarketAddress),
    [eMarketAddress, getAddressEtherscanUrl],
  );
  const rateModelEtherscan = useMemo(
    () => getAddressEtherscanUrl(rateModelAddress),
    [rateModelAddress, getAddressEtherscanUrl],
  );

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
          <OpenInNewIcon sx={{ alignSelf: 'center', height: '1rem', width: '1rem', color: 'figma.grey.700' }} />
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
            boxShadow: '0px 4px 12px rgba(175, 177, 182, 0.2)',
            borderRadius: '2px',
          },
        }}
      >
        <Box px={2} py={1}>
          <Typography variant="subtitle1" fontSize="12px" color="figma.grey.300">
            VIEW IN ETHERSCAN
          </Typography>
        </Box>
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
          <Box ml={1}>
            <a href={assetEtherscan} target="_blank" rel="noopener noreferrer">
              {symbol}
            </a>
          </Box>
        </MenuItem>
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
          <Box ml={1}>
            <a href={eMarketEtherscan} target="_blank" rel="noopener noreferrer">
              {exaToken}
            </a>
          </Box>
        </MenuItem>
        <MenuItem>
          <LinkIcon fontSize="small" />
          <Box ml={1}>
            <a href={rateModelEtherscan} target="_blank" rel="noopener noreferrer">
              Interest Rate Model
            </a>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExplorerMenu;
