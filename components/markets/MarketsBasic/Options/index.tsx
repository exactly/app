import React, { FC } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Box, FormControlLabel, Radio, RadioGroup, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';
import daysLeft from 'utils/daysLeft';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { useTranslation } from 'react-i18next';
import BestPill from 'components/common/BestPill';
import Rates from 'components/Rates';

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
  const { t } = useTranslation();
  const { palette } = useTheme();

  const bottomIconSx = { fontSize: '10px', my: 'auto', color: 'figma.grey.500' };

  return (
    <RadioGroup value={selected} onChange={(e) => setSelected(parseInt(e.target.value))} sx={{ pt: 1 }}>
      {allOptions.map(({ maturity, depositAPR, borrowAPR }, index) => {
        const apr = (operation === 'deposit' ? depositAPR : borrowAPR) ?? 0;

        return (
          <Box display="flex" flexDirection="column" key={`${maturity}_${depositAPR}_${borrowAPR}_${index}`}>
            <FormControlLabel
              data-testid={`simple-view-maturity-option-${maturity}`}
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
                        {maturity ? daysLeft(maturity) : t('Open-ended')}
                      </Typography>
                    ) : (
                      <Skeleton width={52} height={20} />
                    )}
                    {bestOption === maturity && (depositAPR || borrowAPR) && (
                      <Tooltip
                        arrow
                        title={
                          maturity === 0
                            ? t(
                                'This option currently offers the best APR, but please note that is a variable pool and it may change at any time based on market conditions.',
                              )
                            : ''
                        }
                      >
                        <BestPill />
                      </Tooltip>
                    )}
                  </Box>
                  <OptionRate
                    apr={apr}
                    type={operation}
                    isLoading={maturity === 0 ? loadingFloatingOption : loadingFixedOptions}
                    symbol={symbol}
                    minWidth={90}
                    rateType={maturity && maturity !== 0 ? 'fixed' : 'floating'}
                    bottom={
                      <>
                        {maturity ? <LockIcon sx={bottomIconSx} /> : <SwapVertIcon sx={bottomIconSx} />}
                        <Typography
                          fontWeight={500}
                          fontSize={{ xs: 10, sm: 12 }}
                          color="figma.grey.500"
                          textAlign="right"
                        >
                          {maturity === 0 ? t('Variable Rate') : t('Fixed Rate')}
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

const TooltipFixedRate = () => {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography fontSize={12} color="grey.700">
        {t("This percentage stands for a loan's APR (Annual Percentage Rate).")}
      </Typography>
      <Typography fontSize={12} color="grey.700">
        {t('A fixed interest rate remains the same for the entire term of the loan.')}
      </Typography>
      <Typography fontSize={12} color="blue" sx={{ textDecoration: 'underline' }}>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://docs.exact.ly/getting-started/math-paper#4.-fixed-rate-pool"
        >
          {t('Learn more about fixed rates.')}
        </a>
      </Typography>
    </Box>
  );
};

const TooltipFloatingRate = () => {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography fontSize={12} color="grey.700">
        {t("This percentage stands for a loan's APR (Annual Percentage Rate).")}
      </Typography>
      <Typography fontSize={12} color="grey.700">
        {t('A variable interest rate varies over time depending on market changes.')}
      </Typography>
      <Typography fontSize={12} color="blue" sx={{ textDecoration: 'underline' }}>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://docs.exact.ly/getting-started/math-paper#3.-variable-rate-pool"
        >
          {t('Learn more about variable rates.')}
        </a>
      </Typography>
    </Box>
  );
};

const OptionRate: FC<{
  symbol: string;
  apr: number;
  type: 'deposit' | 'borrow';
  isLoading?: boolean;
  bottom: React.ReactNode;
  minWidth?: number;
  rateType?: 'fixed' | 'floating';
}> = ({ symbol, apr, type, isLoading, bottom, minWidth = 0, rateType = 'floating' }) => {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" minWidth={minWidth}>
      <Box display="flex" alignItems="center" justifyContent="right" gap={0.3}>
        <Rates
          symbol={symbol}
          apr={apr}
          type={type}
          label={t('APR')}
          sx={{ fontSize: 13, fontWeight: 700 }}
          directionDesktop="row-reverse"
          iconsSize={14}
          isLoading={isLoading}
          rateType={rateType}
        />
      </Box>
      <Box display="flex" gap={0.3} justifyContent="right">
        {bottom}
      </Box>
    </Box>
  );
};

export default React.memo(Options);
