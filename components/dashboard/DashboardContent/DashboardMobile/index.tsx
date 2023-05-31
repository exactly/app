import React, { FC, PropsWithChildren } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';
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
import { toPercentage } from 'utils/utils';
import useRewards from 'hooks/useRewards';
import RewardPill from 'components/markets/RewardPill';
import ButtonMenu from 'components/ButtonMenu';

type Props = {
  type: 'deposit' | 'borrow';
};

const DashboardMobile: FC<Props> = ({ type }) => {
  const { t } = useTranslation();
  const { accountData, getMarketAccount } = useAccountData();
  const { handleActionClick } = useActionButton();
  const { startDebtManager, isRolloverDisabled } = useStartDebtManagerButton();
  const { rates } = useRewards();
  const { floatingRows, fixedRows } = useDashboard(type);
  const isDeposit = type === 'deposit';

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
                    formatFixed(isDeposit ? depositedAmount : borrowedAmount, getMarketAccount(symbol)?.decimals),
                    symbol,
                  )}`) || <Skeleton width={40} />}
              </FlexItem>
              <FlexItem title={isDeposit ? t('Deposited') : t('Debt')}>
                {(accountData && valueUSD !== undefined && `$${formatNumber(valueUSD, 'USD', true)}`) || (
                  <Skeleton width={40} />
                )}
              </FlexItem>
              <FlexItem title={t('Market APR')}>
                <Box display="flex" width="fit-content" gap={1}>
                  {rates &&
                    rates[symbol] &&
                    rates[symbol].map((r) => (
                      <RewardPill
                        key={r.asset}
                        rate={type === 'deposit' ? r.floatingDeposit : r.borrow}
                        symbol={r.assetSymbol}
                      />
                    ))}
                  {(apr !== undefined && toPercentage(apr)) || <Skeleton width={40} />}
                </Box>
              </FlexItem>
              {isDeposit && (
                <FlexItem title={t('Use as collateral')}>
                  <SwitchCollateral symbol={symbol} />
                </FlexItem>
              )}
            </Box>
            <Box display="flex" gap={0.5}>
              <Button
                fullWidth
                variant="contained"
                sx={{ height: '34px' }}
                onClick={(e) => handleActionClick(e, type, symbol)}
              >
                {isDeposit ? t('Deposit') : t('Borrow')}
              </Button>
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
                <ButtonMenu
                  fullWidth
                  id={`floating-repay-${symbol}`}
                  variant="outlined"
                  sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap', height: '34px' }}
                  onClick={(e) => handleActionClick(e, 'repay', symbol)}
                  options={[
                    {
                      label: t('Rollover'),
                      onClick: () => startDebtManager({ symbol }),
                      disabled: isRolloverDisabled(borrowedAmount),
                    },
                  ]}
                >
                  {t('Repay')}
                </ButtonMenu>
              )}
            </Box>
          </>
        </MobileAssetCard>
      ))}
      {fixedRows.length === 0 ? (
        <Box
          bgcolor="components.bg"
          borderTop="4px solid #0095FF"
          boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
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
                        parseFloat(formatFixed(previewValue, decimals)) * parseFloat(formatFixed(usdPrice, 18)),
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
                  <ButtonMenu
                    fullWidth
                    id={`fixed-${maturity}-repay-${symbol}`}
                    variant="outlined"
                    sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap', height: '34px' }}
                    onClick={(e) => handleActionClick(e, 'repayAtMaturity', symbol, maturity)}
                    options={[
                      {
                        label: t('Rollover'),
                        onClick: () => startDebtManager({ symbol, maturity }),
                        disabled: isRolloverDisabled(),
                      },
                    ]}
                  >
                    {t('Repay')}
                  </ButtonMenu>
                )}
              </>
            </MobileAssetCard>
          );
        })
      )}
    </Box>
  );
};

const FlexItem: FC<PropsWithChildren & { title: string; tooltip?: string | null }> = ({ title, children, tooltip }) => (
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
    <Typography fontSize="16px" fontWeight={700} lineHeight="20px">
      {children}
    </Typography>
  </Box>
);

export default DashboardMobile;
