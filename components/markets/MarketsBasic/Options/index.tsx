import React, { FC } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Box, FormControlLabel, Radio, RadioGroup, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import daysLeft from 'utils/daysLeft';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { toPercentage } from 'utils/utils';
import numbers from 'config/numbers.json';
import { Zero } from '@ethersproject/constants';

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
  const { palette } = useTheme();
  const { minAPRValue } = numbers;

  const bottomIconSx = { fontSize: '10px', my: 'auto', color: 'figma.grey.500' };

  return (
    <RadioGroup value={selected} onChange={(e) => setSelected(parseInt(e.target.value))} sx={{ pt: 1 }}>
      {allOptions.map(({ maturity, depositAPR, borrowAPR, borrowRewards, depositRewards }, index) => {
        const apr = (operation === 'deposit' ? depositAPR : borrowAPR) ?? 0;
        const value = apr > minAPRValue ? apr : undefined;
        const optionRate = `${value && value > 200 ? '∞' : toPercentage(apr)}`;
        return (
          <Box display="flex" flexDirection="column" key={`${maturity}_${depositAPR}_${borrowAPR}_${index}`}>
            <FormControlLabel
              value={maturity}
              control={<Radio />}
              componentsProps={{ typography: { width: '100%' } }}
              sx={{
                m: 0,
                ':hover': { backgroundColor: palette.mode === 'light' ? 'grey.50' : 'grey.200' },
                px: 1,
                borderRadius: '4px',
              }}
              disabled={maturity !== 0 && !maturity}
              label={
                <Box
                  display="flex"
                  flexDirection="row"
                  py="7px"
                  alignItems="center"
                  width="100%"
                  gap={{ xs: 0, sm: 1 }}
                >
                  <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    gap={{ xs: 0, sm: 0.5 }}
                    alignItems={{ xs: 'start', sm: 'center' }}
                    flex={1}
                  >
                    {maturity || maturity === 0 ? (
                      <Typography fontWeight={700} fontSize={13} color="grey.900" my="auto">
                        {maturity ? daysLeft(maturity) : 'Flexible'}
                      </Typography>
                    ) : (
                      <Skeleton width={52} height={20} />
                    )}
                    {bestOption === maturity && (depositAPR || borrowAPR) && (
                      <Tooltip
                        arrow
                        title={
                          maturity === 0
                            ? 'This option currently offers the best APR, but please note that is a variable pool and it may change at any time based on market conditions.'
                            : ''
                        }
                      >
                        <Box
                          width="fit-content"
                          display="flex"
                          alignItems="center"
                          height="16px"
                          py="3px"
                          px="6px"
                          borderRadius="8px"
                          sx={{ background: 'linear-gradient(66.92deg, #00CC68 34.28%, #00CC8F 100%)' }}
                        >
                          <Typography variant="chip" color="components.bg">
                            BEST
                          </Typography>
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                  {(operation === 'deposit' ? depositRewards : borrowRewards)?.map(
                    ({ assetSymbol, rate }) =>
                      rate.gt(Zero) && (
                        <OptionRate
                          key={assetSymbol}
                          isLoading={maturity === 0 ? loadingFloatingOption : loadingFixedOptions}
                          symbol={assetSymbol}
                          value={toPercentage(Number(rate) / 1e18)}
                          bottom={
                            <>
                              <Typography
                                fontWeight={500}
                                fontSize={{ xs: 10, sm: 12 }}
                                color="figma.grey.500"
                                textAlign="right"
                              >
                                Rewards
                              </Typography>
                              <Tooltip
                                componentsProps={{ tooltip: { sx: { maxWidth: 260 } } }}
                                title={<TooltipRewards />}
                                placement="right"
                                arrow
                              >
                                <InfoOutlinedIcon sx={bottomIconSx} />
                              </Tooltip>
                            </>
                          }
                        />
                      ),
                  )}
                  <OptionRate
                    isLoading={maturity === 0 ? loadingFloatingOption : loadingFixedOptions}
                    symbol={symbol}
                    value={optionRate}
                    minWidth={90}
                    bottom={
                      <>
                        {maturity ? <LockIcon sx={bottomIconSx} /> : <SwapVertIcon sx={bottomIconSx} />}
                        <Typography
                          fontWeight={500}
                          fontSize={{ xs: 10, sm: 12 }}
                          color="figma.grey.500"
                          textAlign="right"
                        >
                          {maturity === 0 ? 'Variable' : 'Fixed'} rate
                        </Typography>
                        <Tooltip
                          componentsProps={{ tooltip: { sx: { maxWidth: 260 } } }}
                          title={maturity === 0 ? <TooltipFloatingRate /> : <TooltipFixedRate />}
                          placement="right"
                          arrow
                        >
                          <InfoOutlinedIcon sx={bottomIconSx} />
                        </Tooltip>
                      </>
                    }
                  />
                </Box>
              }
            />
          </Box>
        );
      })}
    </RadioGroup>
  );
};

const TooltipRewards = () => (
  <Box display="flex" flexDirection="column" gap={0.5}>
    <Typography fontSize={12} color="grey.700">
      This percentage stands for the APR of rewards earned for operating on this pool.
    </Typography>
    <Typography fontSize={12} color="grey.700">
      Please note that the APR of rewards can vary over time depending on the market conditions.
    </Typography>
  </Box>
);

const TooltipFixedRate = () => (
  <Box display="flex" flexDirection="column" gap={0.5}>
    <Typography fontSize={12} color="grey.700">
      This percentage stands for a loan&apos;s APR (Annual Percentage Rate).
    </Typography>
    <Typography fontSize={12} color="grey.700">
      A fixed interest rate remains the same for the entire term of the loan.
    </Typography>
    <Typography fontSize={12} color="blue" sx={{ textDecoration: 'underline' }}>
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
    <Typography fontSize={12} color="grey.700">
      This percentage stands for a loan&apos;s APR (Annual Percentage Rate).
    </Typography>
    <Typography fontSize={12} color="grey.700">
      A variable interest rate varies over time depending on market changes.
    </Typography>
    <Typography fontSize={12} color="blue" sx={{ textDecoration: 'underline' }}>
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

const OptionRate: FC<{
  isLoading?: boolean;
  value: string;
  symbol: string;
  bottom: React.ReactNode;
  minWidth?: number;
}> = ({ isLoading = false, value, symbol, bottom, minWidth = 0 }) => {
  return (
    <Box display="flex" flexDirection="column" minWidth={minWidth}>
      <Box display="flex" alignItems="center" justifyContent="right" gap={0.3}>
        {!isLoading ? (
          <Box display="flex" gap={0.5} alignItems="center">
            <Typography fontWeight={700} fontSize={13} color="grey.900" textAlign="right">
              {value}
            </Typography>
            <Typography fontWeight={700} fontSize={{ xs: 11, sm: 13 }} color="grey.900" textAlign="right">
              APR
            </Typography>
          </Box>
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
        {bottom}
      </Box>
    </Box>
  );
};

export default React.memo(Options);
