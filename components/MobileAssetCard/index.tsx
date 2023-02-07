import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import AccountDataContext from 'contexts/AccountDataContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { FC, PropsWithChildren, useCallback, useContext } from 'react';
import formatSymbol from 'utils/formatSymbol';
import getSymbolDescription from 'utils/getSymbolDescription';

type Props = PropsWithChildren<{
  symbol: string;
  isFloating?: boolean;
}>;

const MobileAssetCard: FC<Props> = ({ symbol, isFloating, children }) => {
  const { query } = useRouter();
  const { accountData } = useContext(AccountDataContext);

  const assetDescription = useCallback(
    (s: string) => {
      if (!accountData) return '';
      return getSymbolDescription(accountData, s);
    },
    [accountData],
  );

  return (
    <Box
      bgcolor="#FFFFFF"
      borderTop={isFloating ? '4px solid #33CC59' : '4px solid #0095FF'}
      boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
      borderRadius="6px"
      padding="16px 16px"
      display="flex"
      flexDirection="column"
      gap={2}
    >
      <Box display="flex" justifyContent="space-between">
        <Link href={{ pathname: `/${symbol}`, query }} key={symbol} rel="noopener noreferrer" legacyBehavior>
          <Box display="flex" gap={1.3}>
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={symbol}
              width="40"
              height="40"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Box display="flex" flexDirection="column" my="auto">
              <Typography fontSize="14px" lineHeight="14px" color="grey.500">
                {assetDescription(symbol)}
              </Typography>
              <Typography variant="h5" lineHeight="24px">
                {formatSymbol(symbol)}
              </Typography>
            </Box>
          </Box>
        </Link>
        <Typography
          padding="6px 8px"
          variant="subtitle2"
          bgcolor={isFloating ? '#F3FCF5' : '#F3F7FC'}
          color={isFloating ? '#33CC59' : '#0095FF'}
          mb="auto"
        >
          {isFloating ? 'VARIABLE' : 'FIXED'}
        </Typography>
      </Box>
      {children}
    </Box>
  );
};

export default MobileAssetCard;
