import React, { memo } from 'react';

import { Box, Button, TableCell, TableRow, Typography } from '@mui/material';
import { ActiveRoute, StatusData, UserTxProtocol } from 'types/Bridge';
import AssetAmount from '../AssetAmount';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  route: ActiveRoute;
  protocol?: UserTxProtocol;
  type: string;
  status: StatusData;
  url: string;
};

const TxRow = ({ route, protocol, type, status: { Icon, color, statusLabel }, url }: Props) => {
  return (
    <TableRow key={route.activeRouteId}>
      <TableCell sx={{ paddingY: '32px' }}>
        <AssetAmount asset={route.fromAsset} amount={route.fromAmount} />
      </TableCell>
      <TableCell sx={{ paddingY: '32px' }}>
        <AssetAmount asset={route.toAsset} amount={route.toAmount} />
      </TableCell>

      <TableCell>
        {protocol && (
          <Box display={'flex'} gap={'8px'}>
            <Image
              src={protocol.icon}
              alt={protocol.displayName}
              width={32}
              height={32}
              style={{
                maxWidth: '100%',
                borderRadius: '100%',
              }}
            />
            <Box>
              <Typography fontSize={'14px'} fontWeight={600}>
                {protocol.displayName}
              </Typography>
              <Typography fontSize={'12px'} fontWeight={600} color="grey.500">
                {type}
              </Typography>
            </Box>
          </Box>
        )}
      </TableCell>
      <TableCell>
        <Box display={'flex'} gap={'16px'} flexWrap={'nowrap'}>
          <Box display={'flex'} flexDirection={'column'} flex={1}>
            <Box display={'flex'} gap={'4px'} alignItems={'center'}>
              <Icon sx={{ fontSize: 13, color }} />{' '}
              <Typography fontSize={'12px'} fontWeight={600} color={color}>
                {statusLabel}
              </Typography>
            </Box>
            <Typography fontSize={'12px'} fontWeight={500} color="grey.500">
              {new Date(route.createdAt).toDateString()}
            </Typography>
          </Box>
          <Box display={'flex'} flexDirection={'column'} flex={1}>
            <Link href={url}>
              <Button variant="contained" sx={{ borderRadius: '4px', padding: '4px', height: '20px' }}>
                View TX
              </Button>
            </Link>
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default memo(TxRow);
