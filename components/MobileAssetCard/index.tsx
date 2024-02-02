import React, { FC, PropsWithChildren, useCallback } from 'react';
import { Typography, useTheme, Box, SxProps, Theme } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import formatSymbol from 'utils/formatSymbol';
import getSymbolDescription from 'utils/getSymbolDescription';
import useAccountData from 'hooks/useAccountData';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from 'hooks/useWeb3';

type Props = PropsWithChildren<{
  symbol: string;
  isFloating?: boolean;
  isMarkets?: boolean;
  sx?: SxProps<Theme>;
}>;

const MobileAssetCard: FC<Props> = ({ symbol, isFloating, children, isMarkets = false, sx }) => {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { marketAccount } = useAccountData(symbol);
  const { palette } = useTheme();
  const {
    chain: { id: displayNetworkId },
  } = useWeb3();

  const assetDescription = useCallback(
    (s: string) => {
      if (!marketAccount) return '';
      return getSymbolDescription(marketAccount, s, displayNetworkId);
    },
    [displayNetworkId, marketAccount],
  );

  return (
    <Box
      bgcolor="components.bg"
      borderTop={!isMarkets ? (isFloating ? '4px solid #33CC59' : '4px solid #0095FF') : ''}
      boxShadow={palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : ''}
      borderRadius="6px"
      padding="16px"
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{ ...sx }}
    >
      <Box display="flex" gap={1} justifyContent="space-between">
        <Link href={{ pathname: `/${symbol}`, query }} key={symbol} rel="noopener noreferrer" legacyBehavior>
          <Box display="flex" gap={1.3}>
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={symbol}
              width={isMarkets ? 24 : 40}
              height={isMarkets ? 24 : 40}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Box display="flex" flexDirection="column" my="auto">
              {!isMarkets && (
                <Typography fontSize="14px" lineHeight="14px" color="grey.500">
                  {assetDescription(symbol)}
                </Typography>
              )}
              <Typography variant={isMarkets ? 'dashboardTitle' : 'h5'} lineHeight="24px">
                {formatSymbol(symbol)}
              </Typography>
            </Box>
          </Box>
        </Link>
        {!isMarkets && (
          <Typography
            padding="6px 8px"
            variant="subtitle2"
            bgcolor={palette.mode === 'light' ? (isFloating ? '#F3FCF5' : '#F3F7FC') : 'grey.100'}
            color={isFloating ? '#33CC59' : '#0095FF'}
            mb="auto"
            textTransform="uppercase"
          >
            {isFloating ? t('variable') : t('fixed')}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
};

export default MobileAssetCard;
