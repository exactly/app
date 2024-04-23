import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address, formatUnits } from 'viem';
import { Box, Skeleton, Typography } from '@mui/material';
import { useOperationContext } from '../../contexts/OperationContext';
import { useSocketSwap } from '../../contexts/SocketSwapContext';
import BorrowAtMaturity from '../operations/BorrowAtMaturity';
import useAccountData from '../../hooks/useAccountData';
import ModalAlert from '../common/modal/ModalAlert';
import ModalInfo from '../common/modal/ModalInfo';
import { useWeb3 } from '../../hooks/useWeb3';
import type { DepositConfig } from '.';

type Props = {
  onNextStep: () => void;
  onDeposit: () => void;
  direct: boolean;
  receiver?: Address;
  depositConfig: DepositConfig;
};

const Borrow = ({ onDeposit, direct, receiver, depositConfig, onNextStep }: Props) => {
  const { setSymbol, setQty, setReceiver, setOperation, symbol, tx } = useOperationContext();
  const { route } = useSocketSwap();

  const { marketAccount } = useAccountData('USDC.e');
  const { t } = useTranslation();
  const { chain } = useWeb3();

  useEffect(() => {
    setOperation('borrowAtMaturity');
    setSymbol('USDC.e');
    if (!marketAccount) return;
    if (direct && receiver) setReceiver(receiver);
  }, [chain.id, marketAccount, receiver, setQty, setReceiver, setSymbol, direct, setOperation]);

  useEffect(() => {
    if (tx && tx.status === 'success') onNextStep();
  }, [onNextStep, tx]);

  return (
    <>
      <Typography fontSize={24} fontWeight={700} mb={2}>
        {t('Choose borrow amount')}
      </Typography>
      <Typography mb={1}>
        {t('Remember that your borrow limit is set based on the collateral you deposited on the Protocol.')}
      </Typography>
      <Typography mb={2}>
        {t("To borrow more money, you'll have to ")}
        <a
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          onClick={onDeposit}
        >
          {t('deposit more collateral')}
        </a>
      </Typography>
      {!direct && (
        <ModalAlert
          variant="warning"
          mb={5}
          message={t(
            'This borrowing process will include a token swap from {{from}} to {{to}}; you will find the swap details below.',
            {
              from: symbol,
              to: depositConfig.tokenSymbol,
            },
          )}
        />
      )}
      <Box
        sx={({ palette }) => ({
          p: 3,
          bgcolor: 'components.bg',
          borderRadius: 2,
          boxShadow: palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '',
        })}
      >
        <BorrowAtMaturity>
          {!direct && (
            <Box mt={1}>
              <ModalInfo label={t('Swap Cost')} variant="row">
                {route ? (
                  <Typography fontWeight={500} fontSize={14}>
                    ~${route.totalGasFeesInUsd.toFixed(2)}
                  </Typography>
                ) : (
                  <Skeleton width={100} />
                )}
              </ModalInfo>
              <ModalInfo label={t('Output')} variant="row">
                {route ? (
                  <Typography fontWeight={500} fontSize={14}>
                    {depositConfig.tokenSymbol} ~{formatUnits(BigInt(route.toAmount), depositConfig.decimals)}
                  </Typography>
                ) : (
                  <Skeleton width={100} />
                )}
              </ModalInfo>
            </Box>
          )}
        </BorrowAtMaturity>
      </Box>
    </>
  );
};

export default Borrow;
