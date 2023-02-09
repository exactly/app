import React, { FC } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Box, FormControlLabel, Radio, RadioGroup, Skeleton, Typography } from '@mui/material';
import Image from 'next/image';
import daysLeft from 'utils/daysLeft';
import { MarketsBasicOperation, MarketsBasicOptions } from 'contexts/MarketsBasicContext';
import { toPercentage } from 'utils/utils';
import numbers from 'config/numbers.json';

type Props = {
  symbol: string;
  allOptions: MarketsBasicOptions[];
  selected?: number;
  setSelected: (value: number) => void;
  loadingFloatingOption: boolean;
  loadingFixedOptions: boolean;
  operation: MarketsBasicOperation;
};

const Options: FC<Props> = ({
  symbol,
  allOptions,
  selected,
  setSelected,
  loadingFloatingOption,
  loadingFixedOptions,
  operation,
}) => {
  const { minAPRValue } = numbers;

  return (
    <RadioGroup value={selected} onChange={(e) => setSelected(parseInt(e.target.value))} sx={{ pt: 1 }}>
      {allOptions.map(({ maturity, depositAPR, borrowAPR }, index) => (
        <FormControlLabel
          key={`${maturity}_${depositAPR}_${borrowAPR}_${index}`}
          value={maturity}
          control={<Radio />}
          componentsProps={{ typography: { width: '100%' } }}
          sx={{ m: 0, ':hover': { backgroundColor: 'grey.50' } }}
          disabled={maturity !== 0 && !maturity}
          label={
            <Box
              display="flex"
              flexDirection="row"
              py="7px"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              {maturity || maturity === 0 ? (
                <Typography fontWeight={700} fontSize={14} color="grey.900" my="auto">
                  {maturity ? daysLeft(maturity) : 'Flexible'}
                </Typography>
              ) : (
                <Skeleton width={52} height={20} />
              )}
              <Box display="flex" flexDirection="column">
                <Box display="flex" gap={0.3} justifyContent="right">
                  {(maturity === 0 ? !loadingFloatingOption : !loadingFixedOptions) ? (
                    <Typography fontWeight={700} fontSize={14} color="grey.900" textAlign="right">
                      {`${
                        operation === 'deposit'
                          ? toPercentage((depositAPR || 0) > minAPRValue ? depositAPR : undefined)
                          : toPercentage((borrowAPR || 0) > minAPRValue ? borrowAPR : undefined)
                      } APR`}
                    </Typography>
                  ) : (
                    <Skeleton width={40} height={20} />
                  )}
                  <Image
                    src={`/img/assets/${symbol}.svg`}
                    alt={symbol}
                    width="14"
                    height="14"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
                <Box display="flex" gap={0.3} justifyContent="right">
                  {maturity ? (
                    <LockIcon sx={{ fontSize: '11px', my: 'auto', color: 'figma.grey.500' }} />
                  ) : (
                    <SwapVertIcon sx={{ fontSize: '11px', my: 'auto', color: 'figma.grey.500' }} />
                  )}
                  <Typography fontWeight={500} fontSize={13} color="figma.grey.500" textAlign="right">
                    {maturity === 0 ? 'Variable' : 'Fixed'} interest rate
                  </Typography>
                  <InfoOutlinedIcon sx={{ fontSize: '11px', my: 'auto', color: 'figma.grey.500' }} />
                </Box>
              </Box>
            </Box>
          }
        />
      ))}
    </RadioGroup>
  );
};

export default Options;
