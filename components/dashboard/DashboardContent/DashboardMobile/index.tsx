import React, { FC, PropsWithChildren, useContext, useMemo } from 'react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';
import MobileAssetCard from 'components/MobileAssetCard';
import useActionButton from 'hooks/useActionButton';
import useDashboard from 'hooks/useDashboard';
import AccountDataContext from 'contexts/AccountDataContext';
import formatNumber from 'utils/formatNumber';
import { formatFixed } from '@ethersproject/bignumber';
import SwitchCollateral from '../FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import MaturityLinearProgress from 'components/common/MaturityLinearProgress';
import useFixedOperation from 'hooks/useFixedPoolTransactions';
import calculateAPR from 'utils/calculateAPR';
import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  type: 'deposit' | 'borrow';
};

const DashboardMobile: FC<Props> = ({ type }) => {
  const { accountData } = useContext(AccountDataContext);
  const { handleActionClick } = useActionButton();
  const { floatingRows, fixedRows } = useDashboard(type);
  const isDeposit = type === 'deposit';

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      {floatingRows.map(({ symbol, eTokens, depositedAmount, borrowedAmount }) => (
        <MobileAssetCard key={`dashboard_floating_mobile_${symbol}_${type}`} symbol={symbol} isFloating>
          <>
            <Box display="flex" flexDirection="column" gap={1} width="100%">
              <FlexItem title={isDeposit ? 'Deposited' : 'Debt'}>
                {(accountData &&
                  depositedAmount &&
                  borrowedAmount &&
                  symbol &&
                  `$${formatNumber(
                    parseFloat(
                      formatFixed(isDeposit ? depositedAmount : borrowedAmount, accountData?.[symbol].decimals),
                    ) * parseFloat(formatFixed(accountData[symbol].usdPrice, 18)),
                    'USD',
                    true,
                  )}`) || <Skeleton width={40} />}
              </FlexItem>
              {isDeposit && (
                <FlexItem
                  title="eToken"
                  tooltip="The Exactly voucher token (ERC-4626) for your deposit in the Variable Rate Pool."
                >
                  {(eTokens &&
                    symbol &&
                    `${formatNumber(formatFixed(eTokens, accountData?.[symbol].decimals), symbol)}`) || (
                    <Skeleton width={40} />
                  )}
                </FlexItem>
              )}
              {isDeposit && (
                <FlexItem title="Use as collateral">
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
                {isDeposit ? 'Deposit' : 'Borrow'}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: '34px' }}
                onClick={(e) => handleActionClick(e, isDeposit ? 'withdraw' : 'repay', symbol)}
              >
                {isDeposit ? 'Withdraw' : 'Repay'}
              </Button>
            </Box>
          </>
        </MobileAssetCard>
      ))}
      {fixedRows.map(({ symbol, principal, maturity, decimals, market }) => (
        <MobileAssetCard key={`dashboard_fixed_mobile_${symbol}_${type}_${maturity}`} symbol={symbol}>
          <>
            <Box display="flex" flexDirection="column" gap={1} width="100%">
              <FlexItem title={isDeposit ? 'Deposited' : 'Debt'}>
                {accountData && symbol && principal ? (
                  `$${formatNumber(
                    parseFloat(formatFixed(principal, decimals)) *
                      parseFloat(formatFixed(accountData[symbol].usdPrice, 18)),
                    'USD',
                    true,
                  )}`
                ) : (
                  <Skeleton sx={{ margin: 'auto' }} width={50} />
                )}
              </FlexItem>
              <APRItem type={type} maturityDate={maturity} market={market} decimals={decimals} />
              <FlexItem title="MaturityDate">{maturity ? parseTimestamp(maturity) : <Skeleton width={80} />}</FlexItem>
            </Box>
            <MaturityLinearProgress maturityDate={maturity} />
            <Button
              variant="outlined"
              fullWidth
              sx={{ height: '34px' }}
              onClick={(e) =>
                handleActionClick(e, isDeposit ? 'withdrawAtMaturity' : 'repayAtMaturity', symbol, maturity)
              }
            >
              {isDeposit ? 'Withdraw' : 'Repay'}
            </Button>
          </>
        </MobileAssetCard>
      ))}
    </Box>
  );
};

const FlexItem: FC<PropsWithChildren & { title: string; tooltip?: string }> = ({ title, children, tooltip }) => (
  <Box display="flex" justifyContent="space-between">
    <Box display="flex">
      <Typography fontSize="16px" color="grey.300" lineHeight="20px">
        {title}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip} placement="top" arrow enterTouchDelay={0}>
          <HelpOutlineIcon sx={{ color: 'grey.300', fontSize: '16px', my: 'auto', ml: '4px' }} />
        </Tooltip>
      )}
    </Box>
    <Typography fontSize="16px" fontWeight={700} lineHeight="20px">
      {children}
    </Typography>
  </Box>
);

const APRItem: FC<{ type: 'deposit' | 'borrow'; maturityDate: string; market: string; decimals: number }> = ({
  type,
  maturityDate,
  market,
  decimals,
}) => {
  const { depositTxs, borrowTxs } = useFixedOperation(type, maturityDate, market);

  const APR: number | undefined = useMemo(() => {
    const allTransactions = [...depositTxs, ...borrowTxs];
    if (!allTransactions) return undefined;

    let allAPRbyAmount = 0;
    let allAmounts = 0;

    allTransactions.forEach(({ fee, assets, timestamp, maturity }) => {
      const { transactionAPR } = calculateAPR(fee, decimals, assets, timestamp, maturity);
      allAPRbyAmount += transactionAPR * parseFloat(formatFixed(assets, decimals));
      allAmounts += parseFloat(formatFixed(assets, decimals));
    });

    return allAPRbyAmount / allAmounts;
  }, [depositTxs, borrowTxs, decimals]);

  return (
    <FlexItem title="Avg Fixed Rate" tooltip="Average rate for existing deposits.">
      {APR !== undefined ? `${(APR || 0).toFixed(2)} %` : <Skeleton sx={{ margin: 'auto' }} width={50} />}
    </FlexItem>
  );
};

export default DashboardMobile;
