import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';

import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import numbers from 'config/numbers.json';

import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import useBalance from 'hooks/useBalance';
import useApprove from 'hooks/useApprove';
import usePreviewer from 'hooks/usePreviewer';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { toPercentage } from 'utils/utils';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoFixedAPR from 'components/OperationsModal/Info/ModalInfoFixedAPR';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalInfo from 'components/common/modal/ModalInfo';
import formatNumber from 'utils/formatNumber';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import useHandleOperationError from 'hooks/useHandleOperationError';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (100 * numbers.slippage).toFixed(2);

const DepositAtMaturity: FC = () => {
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();
  const { date } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const {
    symbol,
    errorData,
    setErrorData,
    qty,
    setQty,
    gasCost,
    tx,
    setTx,
    requiresApproval,
    setRequiresApproval,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    marketContract,
    assetContract,
    ETHRouterContract,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const [rawSlippage, setRawSlippage] = useState(DEFAULT_SLIPPAGE);
  const [fixedRate, setFixedRate] = useState<number | undefined>();
  const [gtMaxYield, setGtMaxYield] = useState<boolean>(false);

  const slippage = useMemo(() => parseFixed(String(1 - Number(rawSlippage) / 100), 18), [rawSlippage]);

  const walletBalance = useBalance(symbol, assetContract);
  const { decimals = 18 } = useAccountData(symbol);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('depositAtMaturity', assetContract, marketContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (symbol === 'WETH') {
        const amount = quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT;
        const minAmount = amount.mul(slippage).div(WeiPerEther);
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date, minAmount, {
          value: amount,
        });
        return gasPrice.mul(gasEstimation);
      }

      const amount = quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT;
      const minAmount = amount.mul(slippage).div(WeiPerEther);

      const gasEstimation = await marketContract.estimateGas.depositAtMaturity(date, amount, minAmount, walletAddress);

      return gasPrice.mul(gasEstimation);
    },
    [
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      requiresApproval,
      symbol,
      slippage,
      approveEstimateGas,
      decimals,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => approveIsLoading || isLoadingOp || previewIsLoading,
    [approveIsLoading, isLoadingOp, previewIsLoading],
  );

  const onMax = useCallback(() => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [setErrorData, setQty, walletBalance]);

  const { optimalDepositAmount, depositRate } = useMemo<{
    optimalDepositAmount?: BigNumber;
    depositRate?: BigNumber;
  }>(() => {
    if (!accountData) return { optimalDepositAmount: Zero, depositRate: Zero };

    const { fixedPools = [] } = accountData[symbol];
    const pool = fixedPools.find(({ maturity }) => maturity.toNumber() === date);
    return {
      optimalDepositAmount: pool?.optimalDeposit,
      depositRate: pool?.depositRate,
    };
  }, [accountData, symbol, date]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: `You can't deposit more than you have in your wallet`,
          component: 'input',
        });
      }
      setErrorData(undefined);

      setGtMaxYield(!!optimalDepositAmount && parseFixed(value || '0', decimals).gt(optimalDepositAmount));
    },
    [setQty, walletBalance, setErrorData, optimalDepositAmount, decimals],
  );

  const deposit = useCallback(async () => {
    if (!accountData || !date || !qty || !ETHRouterContract || !marketContract || !walletAddress) return;

    let depositTx;
    try {
      const amount = parseFixed(qty, decimals);
      const minAmount = amount.mul(slippage).div(WeiPerEther);

      if (symbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date, minAmount, {
          value: amount,
        });

        depositTx = await ETHRouterContract.depositAtMaturity(date, minAmount, {
          value: amount,
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.depositAtMaturity(
          date,
          amount,
          minAmount,
          walletAddress,
        );

        depositTx = await marketContract.depositAtMaturity(date, amount, minAmount, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'depositAtMaturity' : 'depositAtMaturityRevert', {
        amount: qty,
        asset: symbol,
        maturity: date,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error) {
      if (depositTx) setTx({ status: 'error', hash: depositTx.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    accountData,
    date,
    qty,
    ETHRouterContract,
    marketContract,
    walletAddress,
    decimals,
    slippage,
    symbol,
    setTx,
    getAccountData,
    setErrorData,
    handleOperationError,
    setIsLoadingOp,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('depositAtMaturityRequest', {
      amount: qty,
      maturity: date,
      asset: symbol,
    });
    return deposit();
  }, [approve, date, deposit, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol]);

  const updateAPR = useCallback(async () => {
    if (!accountData || !date || !previewerContract || !marketContract || !depositRate) return;

    if (qty) {
      const initialAssets = parseFixed(qty, decimals);
      try {
        const { assets: finalAssets } = await previewerContract.previewDepositAtMaturity(
          marketContract.address,
          date,
          initialAssets,
        );

        const currentTimestamp = Date.now() / 1000;
        const time = 31_536_000 / (date - currentTimestamp);

        const rate = finalAssets.mul(WeiPerEther).div(initialAssets);
        const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;

        const slippageAPR = fixedAPR * (1 - numbers.slippage);

        setRawSlippage((slippageAPR * 100).toFixed(2));
        setFixedRate(fixedAPR);
      } catch (error) {
        setFixedRate(undefined);
      }
    } else {
      const fixedAPR = Number(depositRate.toBigInt()) / 1e18;
      const slippageAPR = fixedAPR * (1 - numbers.slippage);
      setRawSlippage((slippageAPR * 100).toFixed(2));
      setFixedRate(fixedAPR);
    }
  }, [accountData, date, previewerContract, marketContract, qty, decimals, depositRate]);

  useEffect(() => {
    void updateAPR();
  }, [updateAPR]);

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={onMax}
              onChange={handleInputChange}
              label="Wallet balance"
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoFixedAPR fixedAPR={toPercentage(fixedRate)} />
            </ModalBoxCell>
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="depositAtMaturity" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="deposit" variant="row" />
          {optimalDepositAmount && (
            <ModalInfo label="Optimal deposit amount" variant="row">
              {formatNumber(formatFixed(optimalDepositAmount, decimals), symbol)}
            </ModalInfo>
          )}
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
        </ModalAdvancedSettings>
      </Grid>

      {(errorData?.status || gtMaxYield) && (
        <Grid item mt={2}>
          {gtMaxYield && <ModalAlert variant="warning" message="You have reached the maximum yield possible" />}
          {errorData?.status && <ModalAlert variant="error" message={errorData.message} />}
        </Grid>
      )}

      <Grid item mt={4}>
        <ModalSubmit
          label="Deposit"
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
          requiresApproval={requiresApproval}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(DepositAtMaturity);
