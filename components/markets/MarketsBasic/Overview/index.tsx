import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

type Props = {
  symbol: string;
};

const Overview: FC<Props> = ({ symbol }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      p={2}
      bgcolor="grey.100"
      border="1px solid #E3E5E8"
      borderRadius="8px"
      gap={0.2}
    >
      <Typography variant="cardTitle">Your total debt</Typography>
      <Box display="flex" gap={0.5} mb={1}>
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={symbol}
          width="20"
          height="20"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Typography fontWeight={700} fontSize={24}>
          4332.25
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Assets to borrow
        </Typography>
        <Box display="flex" gap={0.3}>
          <Typography fontWeight={700} fontSize={13}>
            4300
          </Typography>
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={symbol}
            width="12"
            height="12"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Total interest (+0.75%)
        </Typography>
        <Box display="flex" gap={0.3}>
          <Typography fontWeight={700} fontSize={13}>
            32.25
          </Typography>
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={symbol}
            width="12"
            height="12"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Maturity date (In 88 days)
        </Typography>
        <Typography fontWeight={700} fontSize={13}>
          June 15th, 2023
        </Typography>
      </Box>
    </Box>
  );
};

export default Overview;
