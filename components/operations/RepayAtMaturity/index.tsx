import React, { ChangeEvent, FC, useCallback, useContext, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';

import ModalGif from 'components/common/modal/ModalGif';
import ModalTxCost from 'components/common/modal/ModalTxCost';

import formatNumber from 'utils/formatNumber';

import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import { useWeb3 } from 'hooks/useWeb3';

import numbers from 'config/numbers.json';

import useETHRouter from 'hooks/useETHRouter';
import useMarket from 'hooks/useMarket';
import useERC20 from 'hooks/useERC20';
import useApprove from 'hooks/useApprove';
import handleOperationError from 'utils/handleOperationError';
import useBalance from 'hooks/useBalance';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import { useModalStatus } from 'contexts/ModalStatusContext';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoMaturityStatus from 'components/OperationsModal/Info/ModalInfoMaturityStatus';
import ModalInfoAmount from 'components/OperationsModal/Info/ModalInfoAmount';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const RepayAtMaturity: FC = () => {
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();
  const { date, market } = useContext(MarketContext);
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
  } = useOperationContext();

  const [penaltyAssets, setPenaltyAssets] = useState(Zero);
  const [positionAssetsAmount, setPositionAssetsAmount] = useState(Zero);
  const [rawSlippage, setRawSlippage] = useState(DEFAULT_SLIPPAGE);

  const ETHRouterContract = useETHRouter();
  const assetContract = useERC20();

  const marketContract = useMarket(market);

  const slippage = useMemo(() => parseFixed(String(1 + Number(rawSlippage) / 100), 18), [rawSlippage]);
  const { decimals = 18 } = useAccountData(symbol);

  const maxAmountToRepay = useMemo(
    () => positionAssetsAmount.add(penaltyAssets).mul(slippage).div(WeiPerEther),
    [positionAssetsAmount, penaltyAssets, slippage],
  );

  const walletBalance = useBalance(symbol, assetContract);

  const isLateRepay = useMemo(() => date && Date.now() / 1000 > date, [date]);

  const totalPositionAssets = useMemo(() => {
    if (!accountData || !date) return Zero;
    const pool = accountData[symbol].fixedBorrowPositions.find(({ maturity }) => maturity.toNumber() === date);

    return pool ? pool.position.principal.add(pool.position.fee) : Zero;
  }, [date, accountData, symbol]);

  const totalPenalties = useMemo(() => {
    if (!accountData || !date || !isLateRepay) return Zero;

    const { penaltyRate } = accountData[symbol];

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const penaltyTime = currentTimestamp - date;

    return penaltyRate.mul(penaltyTime).mul(totalPositionAssets).div(WeiPerEther);
  }, [accountData, date, isLateRepay, totalPositionAssets, symbol]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('repayAtMaturity', assetContract, marketContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !ETHRouterContract || !marketContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      const amount = positionAssetsAmount.isZero() ? DEFAULT_AMOUNT : positionAssetsAmount;
      const maxAmount = maxAmountToRepay.isZero() ? DEFAULT_AMOUNT.mul(slippage).div(WeiPerEther) : maxAmountToRepay;

      if (symbol === 'WETH') {
        const gasLimit = await ETHRouterContract.estimateGas.repayAtMaturity(date, amount, {
          value: maxAmount,
        });

        return gasPrice.mul(gasLimit);
      }

      const gasLimit = await marketContract.estimateGas.repayAtMaturity(date, amount, maxAmount, walletAddress);

      return gasPrice.mul(gasLimit);
    },
    [
      walletAddress,
      ETHRouterContract,
      marketContract,
      date,
      requiresApproval,
      positionAssetsAmount,
      maxAmountToRepay,
      slippage,
      symbol,
      approveEstimateGas,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(() => {
    setPenaltyAssets(totalPenalties);
    setPositionAssetsAmount(totalPositionAssets);
    setQty(formatFixed(totalPositionAssets.add(totalPenalties), decimals));

    if (walletBalance && parseFixed(walletBalance, decimals).lt(totalPositionAssets.add(totalPenalties)))
      return setErrorData({ status: true, message: 'Insufficient balance' });

    setErrorData(undefined);
  }, [totalPenalties, totalPositionAssets, setQty, decimals, walletBalance, setErrorData]);

  const handleInputChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      setQty(value);

      const input = parseFixed(value || '0', decimals);

      if (input.isZero() || totalPositionAssets.isZero()) {
        return setErrorData({ status: true, message: "Can't repay 0" });
      }

      const newPositionAssetsAmount = totalPositionAssets.isZero()
        ? Zero
        : input.mul(totalPositionAssets.mul(WeiPerEther).div(totalPositionAssets.add(totalPenalties))).div(WeiPerEther);
      const newPenaltyAssets = input.sub(newPositionAssetsAmount);
      setPenaltyAssets(newPenaltyAssets);
      setPositionAssetsAmount(newPositionAssetsAmount);

      const totalAmount = newPenaltyAssets.add(newPositionAssetsAmount);
      if (walletBalance && parseFixed(walletBalance, decimals).lt(totalAmount)) {
        return setErrorData({ status: true, message: 'Insufficient balance' });
      }

      setErrorData(undefined);
    },
    [setQty, decimals, totalPositionAssets, totalPenalties, walletBalance, setErrorData],
  );

  const repay = useCallback(async () => {
    if (!accountData || !date || !ETHRouterContract || !qty || !marketContract || !walletAddress) return;

    let repayTx;
    try {
      setIsLoadingOp(true);

      if (symbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.repayAtMaturity(date, positionAssetsAmount, {
          value: maxAmountToRepay,
        });

        repayTx = await ETHRouterContract.repayAtMaturity(date, positionAssetsAmount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          value: maxAmountToRepay,
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.repayAtMaturity(
          date,
          positionAssetsAmount,
          maxAmountToRepay,
          walletAddress,
        );

        repayTx = await marketContract.repayAtMaturity(date, positionAssetsAmount, maxAmountToRepay, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: repayTx?.hash });

      const { status, transactionHash } = await repayTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'repayAtMaturity' : 'repayAtMaturityRevert', {
        amount: qty,
        asset: symbol,
        maturity: date,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error) {
      if (repayTx) setTx({ status: 'error', hash: repayTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    date,
    getAccountData,
    marketContract,
    maxAmountToRepay,
    positionAssetsAmount,
    qty,
    setErrorData,
    setIsLoadingOp,
    setTx,
    symbol,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('repayAtMaturityRequest', {
      amount: qty,
      maturity: date,
      asset: symbol,
    });

    return repay();
  }, [approve, date, isLoading, needsApproval, qty, repay, requiresApproval, setRequiresApproval, symbol]);

  if (tx) return <ModalGif tx={tx} tryAgain={repay} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              onMax={onMax}
              onChange={handleInputChange}
              error={errorData}
              label="Debt amount"
              amount={formatFixed(totalPositionAssets, decimals)}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>{date && <ModalInfoMaturityStatus date={date} />}</ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label="Amount at maturity"
                symbol={symbol}
                value={formatNumber(formatFixed(totalPositionAssets, decimals), symbol, true)}
              />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoAmount
                label="Max. amount to be paid"
                value={formatNumber(formatFixed(maxAmountToRepay, decimals), symbol, true)}
                symbol={symbol}
              />
            </ModalBoxCell>
            {isLateRepay && (
              <>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label="Penalties to be paid"
                    value={formatNumber(formatFixed(penaltyAssets, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
                <ModalBoxCell>
                  <ModalInfoAmount
                    label="Assets to be paid"
                    value={formatNumber(formatFixed(positionAssetsAmount, decimals), symbol, true)}
                    symbol={symbol}
                  />
                </ModalBoxCell>
              </>
            )}
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="repayAtMaturity" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} variant="row" />
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={2}>
          <ModalAlert variant="error" message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={4}>
        <ModalSubmit
          label="Repay"
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

export default React.memo(RepayAtMaturity);
