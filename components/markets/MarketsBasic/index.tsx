import { Box, Button, Divider, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import React, { FC } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AssetInput from 'components/OperationsModal/AssetInput';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Image from 'next/image';
import useMaturityPools from 'hooks/useMaturityPools';
import numbers from 'config/numbers.json';
import { toPercentage } from 'utils/utils';
import daysLeft from 'utils/daysLeft';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import OperationTabs from './OperationTabs';
import { useMarketsBasic } from 'contexts/MarketsBasicContext';

const MarketsBasic: FC = () => {
  const { symbol = 'DAI', operation } = useMarketsBasic();

  const maturityPools = useMaturityPools(symbol);
  const { depositAPR: floatingDepositAPR, borrowAPR: floatingBorrowAPR } = useFloatingPoolAPR(symbol);

  const { minAPRValue } = numbers;
  const allPools: { maturity?: number; depositAPR?: number; borrowAPR?: number }[] = [
    { depositAPR: floatingDepositAPR, borrowAPR: floatingBorrowAPR },
    ...maturityPools.map(({ maturity, depositAPR, borrowAPR }) => ({ maturity, depositAPR, borrowAPR })),
  ];

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box
        display="flex"
        flexDirection="column"
        p={2}
        gap={1}
        bgcolor="grey.100"
        maxWidth="400px"
        minHeight="600px"
        sx={{ borderRadius: '16px' }}
        boxShadow="4px 8px 16px rgba(227, 229, 232, 0.5), -4px -8px 16px rgba(248, 249, 249, 0.25)"
      >
        <OperationTabs />

        <Box display="flex" flexDirection="column" bgcolor="white" border="1px solid #EDF0F2" borderRadius="8px">
          <Box px={2} py={1.5}>
            <Typography fontWeight={600} fontSize={13} color="figma.grey.600">
              Amount
            </Typography>
            <AssetInput
              qty={'0'}
              decimals={18}
              symbol={symbol}
              onMax={undefined}
              onChange={() => 1}
              label="Wallet balance"
              amount={'100'}
            />
          </Box>
          <Divider sx={{ background: 'figma.grey.700' }} />
          <Box px={2} py={1.5}>
            <Typography fontWeight={600} fontSize={13} color="figma.grey.600">
              Days to maturity
            </Typography>
            <RadioGroup value={1} onChange={undefined} sx={{ pt: 1 }}>
              {allPools.map(({ maturity, depositAPR, borrowAPR }) => (
                <FormControlLabel
                  key={`${maturity}_${depositAPR}_${borrowAPR}`}
                  value="female"
                  control={<Radio />}
                  componentsProps={{ typography: { width: '100%' } }}
                  sx={{ m: 0, ':hover': { backgroundColor: 'grey.50' } }}
                  label={
                    <Box display="flex" flexDirection="row" py="7px" justifyContent="space-between" width="100%">
                      <Box display="flex" flexDirection="column">
                        <Typography fontWeight={700} fontSize={14} color="grey.900">
                          {maturity ? daysLeft(maturity) : 'Flexible'}
                        </Typography>
                        <Box display="flex" gap={0.3}>
                          <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
                            {maturity ? 'Fixed rate' : 'Variable rate'}
                          </Typography>
                          <InfoOutlinedIcon sx={{ fontSize: '11px', my: 'auto', color: 'figma.grey.500' }} />
                        </Box>
                      </Box>
                      <Box display="flex" flexDirection="column">
                        <Box display="flex" gap={0.3} justifyContent="right">
                          <Typography fontWeight={700} fontSize={14} color="grey.900" textAlign="right">
                            +
                            {operation === 'deposit'
                              ? toPercentage((depositAPR || 0) > minAPRValue ? depositAPR : undefined)
                              : toPercentage((borrowAPR || 0) > minAPRValue ? borrowAPR : undefined)}
                          </Typography>
                          <Image
                            src={`/img/assets/${symbol}.svg`}
                            alt={symbol}
                            width="12"
                            height="12"
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                        <Box display="flex" gap={0.3} justifyContent="right">
                          <LockIcon sx={{ fontSize: '11px', my: 'auto', color: 'figma.grey.500' }} />
                          <Typography fontWeight={500} fontSize={13} color="figma.grey.500" textAlign="right">
                            APR
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

        <Box
          display="flex"
          flexDirection="column"
          p={2}
          bgcolor="grey.100"
          border="1px solid #E3E5E8"
          borderRadius="8px"
          gap={0.2}
        >
          <Typography fontWeight={600} fontSize={13} color="figma.grey.600">
            Your total debt
          </Typography>
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
              Total Principal
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
        <Box mt={1}>
          <Button fullWidth variant="contained">
            Borrow USDC
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
