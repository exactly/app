import React, { useState, useCallback, type FC } from 'react';
import Image from 'next/image';
import { Box, Button, Menu, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { formatUnits } from 'viem';

import { useWeb3 } from 'hooks/useWeb3';
import useRewards from 'hooks/useRewards';
import formatNumber from 'utils/formatNumber';
import { useTranslation } from 'react-i18next';

const ClaimRewards: FC = () => {
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { rewards, claimable, claim, isLoading } = useRewards();

  const open = useCallback((event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget), []);
  const close = useCallback(() => setAnchorEl(null), []);
  const isOpen = Boolean(anchorEl);
  const onClickClaim = useCallback(async () => {
    await claim();
    close();
  }, [claim, close]);

  if (!walletAddress || !claimable || Object.keys(rewards).length === 0) {
    return null;
  }

  const [assetSymbol, amount] = Object.entries(rewards)[0];

  return (
    <>
      <Button
        variant="outlined"
        onClick={open}
        id="claim-rewards-button"
        aria-controls={isOpen ? 'claim-rewards-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isOpen ? 'true' : undefined}
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 1,
          borderColor: '#CFD3D8',
          '&:hover': {
            backgroundColor: 'components.bg',
            borderColor: 'figma.grey.100',
            boxShadow: '0px 3px 4px rgba(97, 102, 107, 0.1)',
          },
        }}
      >
        <Image
          src={`/img/assets/${assetSymbol}.svg`}
          alt={assetSymbol}
          width={16}
          height={16}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <Typography variant="subtitle1" color="grey.900">
          {formatNumber(formatUnits(amount, 18))}
        </Typography>
      </Button>
      <Menu
        id="claim-rewards-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={close}
        MenuListProps={{
          'aria-labelledby': 'claim-rewards-button',
        }}
        PaperProps={{
          style: {
            marginTop: '8px',
            padding: '16px',
            boxShadow: '0px 4px 10px rgba(97, 102, 107, 0.1)',
            borderRadius: 16,
            minWidth: 160,
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="stretch" gap={1}>
          <Typography fontWeight="500" textAlign="center" color="figma.grey.600" fontSize={13}>
            {t('Your rewards')}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" gap={1} height={40} minWidth={128}>
            <Image
              src={`/img/assets/${assetSymbol}.svg`}
              alt={assetSymbol}
              width={20}
              height={20}
              style={{
                maxWidth: '100%',
                height: 'auto',
                marginBottom: 4,
              }}
            />
            <Typography fontWeight="700" fontSize={24} color="grey.900" lineHeight="1">
              {formatNumber(formatUnits(amount, 18))}
            </Typography>
          </Box>

          <LoadingButton
            variant="outlined"
            onClick={onClickClaim}
            disabled={isLoading}
            loading={isLoading}
            sx={{ color: 'grey.700', borderColor: '#CFD3D8' }}
          >
            {t('Claim')}
          </LoadingButton>
        </Box>
      </Menu>
    </>
  );
};

export default React.memo(ClaimRewards);
