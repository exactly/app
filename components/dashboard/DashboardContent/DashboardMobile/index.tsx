import React, { FC, PropsWithChildren, useEffect } from 'react';
import { formatUnits } from 'viem';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, ButtonGroup, Grid, Skeleton, Tooltip, Typography } from '@mui/material';
import MaturityLinearProgress from 'components/common/MaturityLinearProgress';
import MobileAssetCard from 'components/MobileAssetCard';
import useActionButton, { useStartDebtManagerButton } from 'hooks/useActionButton';
import useDashboard from 'hooks/useDashboard';
import formatNumber from 'utils/formatNumber';
import parseTimestamp from 'utils/parseTimestamp';
import SwitchCollateral from '../FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import APRItem from '../FixedPoolDashboard/FixedPoolDashboardTable/APRItem';
import useAccountData from 'hooks/useAccountData';
import { useTranslation } from 'react-i18next';
import useAnalytics from 'hooks/useAnalytics';
import Rates from 'components/Rates';

type Props = {
  type: 'deposit' | 'borrow';
};

const DashboardMobile: FC<Props> = ({ type }) => {
  const { t } = useTranslation();
  const { accountData, getMarketAccount } = useAccountData();
  const { handleActionClick } = useActionButton();
  const { startDebtManager, isRolloverDisabled } = useStartDebtManagerButton();
  const { floatingRows, fixedRows } = useDashboard(type);
  const isDeposit = type === 'deposit';

  const {
    list: { viewItemListDashboard },
  } = useAnalytics();

  useEffect(() => {
    if (floatingRows?.[0]?.apr) {
      viewItemListDashboard(floatingRows, 'floating', type);
    }
  }, [floatingRows, viewItemListDashboard, type]);

  useEffect(() => {
    if (fixedRows.length) {
      viewItemListDashboard(fixedRows, 'fixed', type);
    }
  }, [fixedRows, viewItemListDashboard, type]);

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      {floatingRows.map(({ symbol, depositedAmount, borrowedAmount, valueUSD, apr }) => (
        <MobileAssetCard key={`dashboard_floating_mobile_${symbol}_${type}`} symbol={symbol} isFloating>
          <>
            <Box display="flex" flexDirection="column" gap={1} width="100%">
              <FlexItem
                title={isDeposit ? t('Deposited Amount') : t('Borrowed Amount')}
                tooltip={t(`Amount of tokens {{action}} in the pool.`, {
                  action: isDeposit ? t('deposited') : t('borrowed'),
                })}
              >
                {(depositedAmount &&
                  borrowedAmount &&
                  `${formatNumber(
                    formatUnits(isDeposit ? depositedAmount : borrowedAmount, getMarketAccount(symbol)?.decimals ?? 18),
                    symbol,
                  )}`) || <Skeleton width={40} />}
              </FlexItem>
              <FlexItem title={isDeposit ? t('Deposited') : t('Debt')}>
                {(accountData && valueUSD !== undefined && `$${formatNumber(valueUSD, 'USD', true)}`) || (
                  <Skeleton width={40} />
                )}
              </FlexItem>
              <FlexItem title={t('Total APR')}>
                <Box display="flex" width="fit-content" gap={1}>
                  <Rates symbol={symbol} apr={apr} type={type} />
                </Box>
              </FlexItem>
              {isDeposit && (
                <FlexItem title={t('Use as collateral')}>
                  <SwitchCollateral symbol={symbol} />
                </FlexItem>
              )}
            </Box>
            <Grid container spacing={0.5}>
              <Grid item xs={isDeposit ? 6 : 4}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ height: '34px', whiteSpace: 'nowrap' }}
                  onClick={(e) => handleActionClick(e, type, symbol)}
                >
                  {isDeposit ? t('Deposit') : t('Borrow')}
                </Button>
              </Grid>
              <Grid item xs={isDeposit ? 6 : 8}>
                {isDeposit ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: '34px' }}
                    onClick={(e) => handleActionClick(e, 'withdraw', symbol)}
                  >
                    {t('Withdraw')}
                  </Button>
                ) : (
                  <ButtonGroup fullWidth disableElevation>
                    <Button
                      variant="outlined"
                      sx={{
                        backgroundColor: 'components.bg',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        '&:hover': { zIndex: 1 },
                      }}
                      onClick={(e) => handleActionClick(e, 'repay', symbol)}
                    >
                      {t('Repay')}
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{
                        backgroundColor: 'components.bg',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        '&:disabled': {
                          borderLeftColor: ({ palette }) => palette.grey[palette.mode === 'light' ? 500 : 300],
                        },
                      }}
                      onClick={() => startDebtManager({ symbol })}
                      disabled={isRolloverDisabled(borrowedAmount)}
                    >
                      {t('Rollover')}
                    </Button>
                  </ButtonGroup>
                )}
              </Grid>
            </Grid>
          </>
        </MobileAssetCard>
      ))}
      {fixedRows.length === 0 ? (
        <Box
          bgcolor="components.bg"
          borderTop="4px solid #0095FF"
          boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
          borderRadius="6px"
          padding="20px 0 24px 0"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={1}
        >
          <Typography fontWeight={700} fontSize={15}>
            {t('Fixed Interest Rate')}
          </Typography>
          <Typography color="grey.500" fontSize={13}>
            {t('No {{operations}} found', { operations: type === 'deposit' ? t('deposits') : t('borrows') })}
          </Typography>
        </Box>
      ) : (
        fixedRows.map(({ symbol, previewValue, maturity, decimals, market }) => {
          const usdPrice = getMarketAccount(symbol)?.usdPrice;
          return (
            <MobileAssetCard key={`dashboard_fixed_mobile_${symbol}_${type}_${maturity}`} symbol={symbol}>
              <>
                <Box display="flex" flexDirection="column" gap={1} width="100%">
                  <FlexItem title={t('Market value')}>
                    {usdPrice && previewValue ? (
                      `$${formatNumber(
                        formatUnits((previewValue * usdPrice) / 10n ** BigInt(decimals), 18),
                        'USD',
                        true,
                      )}`
                    ) : (
                      <Skeleton sx={{ margin: 'auto' }} width={50} />
                    )}
                  </FlexItem>
                  <FlexItem title={t('Avg Fixed Rate')} tooltip={t('Average rate for existing deposits.')}>
                    <APRItem type={type} maturityDate={maturity} market={market} decimals={decimals} />
                  </FlexItem>
                  <FlexItem title={t('Maturity Date')}>
                    {maturity ? parseTimestamp(maturity) : <Skeleton width={80} />}
                  </FlexItem>
                </Box>
                <MaturityLinearProgress maturityDate={maturity} operation={type} symbol={symbol} />
                {isDeposit ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: '34px' }}
                    onClick={(e) => handleActionClick(e, 'withdrawAtMaturity', symbol, maturity)}
                  >
                    {isDeposit ? t('Withdraw') : t('Repay')}
                  </Button>
                ) : (
                  <ButtonGroup fullWidth>
                    <Button
                      variant="outlined"
                      sx={{
                        backgroundColor: 'components.bg',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        '&:hover': { zIndex: 1 },
                      }}
                      onClick={(e) => handleActionClick(e, 'repayAtMaturity', symbol, maturity)}
                    >
                      {t('Repay')}
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{
                        backgroundColor: 'components.bg',
                        whiteSpace: 'nowrap',
                        height: '34px',
                        '&:disabled': {
                          borderLeftColor: ({ palette }) => palette.grey[palette.mode === 'light' ? 500 : 300],
                        },
                      }}
                      onClick={() => startDebtManager({ symbol, maturity: BigInt(maturity) })}
                      disabled={isRolloverDisabled()}
                    >
                      {t('Rollover')}
                    </Button>
                  </ButtonGroup>
                )}
              </>
            </MobileAssetCard>
          );
        })
      )}
    </Box>
  );
};

const FlexItem: FC<PropsWithChildren & { title: string; tooltip?: string }> = ({ title, children, tooltip }) => (
  <Box display="flex" justifyContent="space-between">
    <Box display="flex">
      <Typography fontSize="16px" color="figma.grey.300" lineHeight="20px" fontWeight={500}>
        {title}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip} placement="top" arrow enterTouchDelay={0}>
          <HelpOutlineIcon sx={{ color: 'figma.grey.300', fontSize: '15px', my: 'auto', ml: '4px' }} />
        </Tooltip>
      )}
    </Box>
    <Typography component="div" fontSize="16px" fontWeight={700} lineHeight="20px">
      {children}
    </Typography>
  </Box>
);

export default DashboardMobile;
