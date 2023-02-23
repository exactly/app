import React, { FC } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Box, FormControlLabel, Radio, RadioGroup, Skeleton, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';
import daysLeft from 'utils/daysLeft';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { toPercentage } from 'utils/utils';
import numbers from 'config/numbers.json';

type Props = {
  symbol: string;
  allOptions: MarketsBasicOption[];
  selected?: number;
  setSelected: (value: number) => void;
  loadingFloatingOption: boolean;
  loadingFixedOptions: boolean;
  operation: MarketsBasicOperation;
  bestOption: MarketsBasicOption['maturity'];
};

const Options: FC<Props> = ({
  symbol,
  allOptions,
  selected,
  setSelected,
  loadingFloatingOption,
  loadingFixedOptions,
  operation,
  bestOption,
}) => {
  const { minAPRValue } = numbers;

  const bottomIconSx = { fontSize: '11px', my: 'auto', color: 'figma.grey.500' };

  return (
    <RadioGroup value={selected} onChange={(e) => setSelected(parseInt(e.target.value))} sx={{ pt: 1 }}>
      {allOptions.map(({ maturity, depositAPR, borrowAPR, borrowRewards, depositRewards }, index) => {
        const apr = (operation === 'deposit' ? depositAPR : borrowAPR) ?? 0;
        const value = apr > minAPRValue ? apr : undefined;
        const optionRate = `${value && value > 200 ? '∞' : toPercentage(apr)} APR`;
        return (
          <FormControlLabel
            key={`${maturity}_${depositAPR}_${borrowAPR}_${index}`}
            value={maturity}
            control={<Radio />}
            componentsProps={{ typography: { width: '100%' } }}
            sx={{ m: 0, ':hover': { backgroundColor: 'grey.50' } }}
            disabled={maturity !== 0 && !maturity}
            label={
              <Box display="flex" flexDirection="row" py="7px" alignItems="center" width="100%" gap={2}>
                <Box display="flex" gap={0.5} alignItems="center" flex={1}>
                  {maturity || maturity === 0 ? (
                    <Typography fontWeight={700} fontSize={14} color="grey.900" my="auto">
                      {maturity ? daysLeft(maturity) : 'Flexible'}
                    </Typography>
                  ) : (
                    <Skeleton width={52} height={20} />
                  )}
                  {bestOption === maturity && (
                    <Box
                      display="flex"
                      alignItems="center"
                      height="16px"
                      py="3px"
                      px="6px"
                      borderRadius="8px"
                      sx={{ background: 'linear-gradient(66.92deg, #00CC68 34.28%, #00CC8F 100%)' }}
                    >
                      <Typography variant="chip" color="white">
                        BEST
                      </Typography>
                    </Box>
                  )}
                </Box>
                <OptionRate
                  isLoading={maturity === 0 ? loadingFloatingOption : loadingFixedOptions}
                  symbol={symbol}
                  value={optionRate}
                  bottom={
                    <>
                      {maturity ? <LockIcon sx={bottomIconSx} /> : <SwapVertIcon sx={bottomIconSx} />}
                      <Typography fontWeight={500} fontSize={13} color="figma.grey.500" textAlign="right">
                        {maturity === 0 ? 'Variable' : 'Fixed'} rate
                      </Typography>
                      <Tooltip
                        title={maturity === 0 ? <TooltipFloatingRate /> : <TooltipFixedRate />}
                        placement="right"
                        arrow
                      >
                        <InfoOutlinedIcon sx={bottomIconSx} />
                      </Tooltip>
                    </>
                  }
                />

                {(operation === 'deposit' ? depositRewards : borrowRewards)?.map(({ assetSymbol, rate }) => (
                  <OptionRate
                    key={assetSymbol}
                    isLoading={maturity === 0 ? loadingFloatingOption : loadingFixedOptions}
                    symbol={assetSymbol}
                    value={toPercentage(Number(rate) / 1e18)}
                    bottom={
                      <>
                        <Typography fontWeight={500} fontSize={13} color="figma.grey.500" textAlign="right">
                          Rewards
                        </Typography>
                        <InfoOutlinedIcon sx={bottomIconSx} />
                      </>
                    }
                  />
                ))}
              </Box>
            }
          />
        );
      })}
    </RadioGroup>
  );
};

const TooltipFixedRate = () => (
  <Box display="flex" flexDirection="column" gap={0.5}>
    <Typography fontSize={13} color="grey.700">
      This percentage stands for a loan&apos;s APR (Annual Percentage Rate).
    </Typography>
    <Typography fontSize={13} color="grey.700">
      A fixed interest rate remains the same for the entire term of the loan.
    </Typography>
    <Typography fontSize={13} color="blue" sx={{ textDecoration: 'underline' }}>
      <a
        target="_blank"
        rel="noreferrer noopener"
        href="https://docs.exact.ly/getting-started/math-paper#4.-fixed-rate-pool"
      >
        Learn more about fixed rates.
      </a>
    </Typography>
  </Box>
);

const TooltipFloatingRate = () => (
  <Box display="flex" flexDirection="column" gap={0.5}>
    <Typography fontSize={13} color="grey.700">
      This percentage stands for a loan&apos;s APR (Annual Percentage Rate).
    </Typography>
    <Typography fontSize={13} color="grey.700">
      A variable interest rate varies over time depending on market changes.
    </Typography>
    <Typography fontSize={13} color="blue" sx={{ textDecoration: 'underline' }}>
      <a
        target="_blank"
        rel="noreferrer noopener"
        href="https://docs.exact.ly/getting-started/math-paper#3.-variable-rate-pool"
      >
        Learn more about variable rates.
      </a>
    </Typography>
  </Box>
);

const OptionRate: FC<{ isLoading?: boolean; value: string; symbol: string; bottom: React.ReactNode }> = ({
  isLoading = false,
  value,
  symbol,
  bottom,
}) => {
  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" gap={0.3} justifyContent="right">
        {!isLoading ? (
          <Typography fontWeight={700} fontSize={14} color="grey.900" textAlign="right">
            {value}
          </Typography>
        ) : (
          <Skeleton width={40} height={20} />
        )}
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={symbol}
          width="14"
          height="14"
          style={{ maxWidth: '100%', height: 'auto', marginBottom: 2 }}
        />
      </Box>
      <Box display="flex" gap={0.3} justifyContent="right">
        {bottom}
      </Box>
    </Box>
  );
};

export default React.memo(Options);
