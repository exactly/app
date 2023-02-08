import { Box, Button, Divider, FormControlLabel, Radio, RadioGroup, Skeleton, Typography } from '@mui/material';
import React, { FC, useCallback, useMemo } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AssetInput from 'components/OperationsModal/AssetInput';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Image from 'next/image';
import numbers from 'config/numbers.json';
import { toPercentage } from 'utils/utils';
import daysLeft from 'utils/daysLeft';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import OperationTabs from './OperationTabs';
import { MarketsBasicOptions, useMarketsBasic } from 'contexts/MarketsBasicContext';
import { useOperationContext } from 'contexts/OperationContext';
import useBalance from 'hooks/useBalance';
import useAccountData from 'hooks/useAccountData';
import Overview from './Overview';
import usePreviewFixedOperation from 'hooks/usePreviewFixedOperation';

const MarketsBasic: FC = () => {
  const { symbol = 'DAI', operation, selected, setSelected } = useMarketsBasic();
  const { setErrorData, qty, setQty, assetContract } = useOperationContext();
  const { decimals = 18 } = useAccountData(symbol);
  const walletBalance = useBalance(symbol, assetContract);

  const onMax = useCallback(() => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [walletBalance, setQty, setErrorData]);

  const handleInputChange = useCallback((value: string) => setQty(value), [setQty]);

  const { options: fixedOptions, loading: loadingFixedOptions } = usePreviewFixedOperation(operation);
  const {
    depositAPR: floatingDepositAPR,
    borrowAPR: floatingBorrowAPR,
    loading: loadingFloatingOption,
  } = useFloatingPoolAPR(symbol);

  const { minAPRValue } = numbers;
  const allPools: MarketsBasicOptions[] = useMemo(
    () => [
      { maturity: 0, depositAPR: floatingDepositAPR, borrowAPR: floatingBorrowAPR },
      ...fixedOptions.map(({ maturity, depositAPR, borrowAPR }) => ({ maturity, depositAPR, borrowAPR })),
    ],
    [fixedOptions, floatingBorrowAPR, floatingDepositAPR],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box
        display="flex"
        flexDirection="column"
        p={2}
        gap={1}
        bgcolor="grey.100"
        maxWidth="400px"
        sx={{ borderRadius: '16px' }}
        boxShadow="4px 8px 16px rgba(227, 229, 232, 0.5), -4px -8px 16px rgba(248, 249, 249, 0.25)"
      >
        <OperationTabs />

        <Box display="flex" flexDirection="column" bgcolor="white" border="1px solid #EDF0F2" borderRadius="8px">
          <Box px={2} py={1.5}>
            <Typography variant="cardTitle">Asset to {operation}</Typography>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={onMax}
              onChange={handleInputChange}
              label="Wallet balance"
              amount={walletBalance}
            />
          </Box>
          <Divider sx={{ background: 'figma.grey.700' }} />
          <Box px={2} py={1.5}>
            <Typography variant="cardTitle">Days to maturity</Typography>
            <RadioGroup value={selected} onChange={(e) => setSelected(parseInt(e.target.value))} sx={{ pt: 1 }}>
              {allPools.map(({ maturity, depositAPR, borrowAPR }, index) => (
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
                              +
                              {operation === 'deposit'
                                ? toPercentage((depositAPR || 0) > minAPRValue ? depositAPR : undefined)
                                : toPercentage((borrowAPR || 0) > minAPRValue ? borrowAPR : undefined)}
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
                            {maturity === 0 ? 'Variable' : 'Fixed'} APR
                          </Typography>
                          <InfoOutlinedIcon sx={{ fontSize: '11px', my: 'auto', color: 'figma.grey.500' }} />
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </Box>
        </Box>

        {Boolean(selected) && Boolean(qty) && <Overview symbol={symbol} />}

        <Box mt={1}>
          <Button fullWidth variant="contained">
            {`${operation === 'deposit' ? 'Deposit' : 'Borrow'} ${symbol}`}
          </Button>
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" gap={0} px={3}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="modalRow" color="grey.500">
            TX Cost
          </Typography>
          <Box display="flex" gap={0.5}>
            <Typography variant="modalRow">~$2.44</Typography>
            <Typography variant="modalRow" color="grey.500">
              (18 Gwei)
            </Typography>
            <EditIcon sx={{ fontSize: '14px', my: 'auto', color: 'grey.400' }} />
          </Box>
        </Box>
        <Box display="flex" gap={0.3}>
          <Typography variant="modalRow" color="grey.500">
            Advanced settings
          </Typography>
          <ChevronRightIcon sx={{ fontSize: '14px', color: 'grey.500', my: 'auto' }} />
        </Box>
      </Box>
    </Box>
  );
};

export default MarketsBasic;
