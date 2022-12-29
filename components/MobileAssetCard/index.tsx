import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { FC, PropsWithChildren } from 'react';
import getSymbolDescription from 'utils/getSymbolDescription';

type Props = {
  symbol: string;
  isFloating?: boolean;
};

const MobileAssetCard: FC<PropsWithChildren & Props> = ({ symbol, isFloating, children }) => {
  const { query } = useRouter();

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
              <Typography fontSize="14px" lineHeight="12px" color="grey.500">
                {getSymbolDescription(symbol)}
              </Typography>
              <Typography variant="h5" lineHeight="24px">
                {symbol}
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
