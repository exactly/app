import React, { ChangeEvent, FC, useCallback, useContext, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import LoadingButton from '@mui/lab/LoadingButton';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalError from 'components/common/modal/ModalError';
import ModalGif from 'components/common/modal/ModalGif';
import ModalInput from 'components/common/modal/ModalInput';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';

import { LangKeys } from 'types/Lang';

import formatNumber from 'utils/formatNumber';

import AccountDataContext from 'contexts/AccountDataContext';
import LangContext from 'contexts/LangContext';
import { MarketContext } from 'contexts/MarketContext';
import { useWeb3Context } from 'contexts/Web3Context';

import numbers from 'config/numbers.json';

import useETHRouter from 'hooks/useETHRouter';
import useMarket from 'hooks/useMarket';
import keys from './translations.json';
import useERC20 from 'hooks/useERC20';
import useApprove from 'hooks/useApprove';
import handleOperationError from 'utils/handleOperationError';
import useBalance from 'hooks/useBalance';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const RepayAtMaturity: FC = () => {
  const { walletAddress } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

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

  const [isSlippageEditable, setIsSlippageEditable] = useState(false);
  const [penaltyAssets, setPenaltyAssets] = useState(Zero);
  const [positionAssetsAmount, setPositionAssetsAmount] = useState(Zero);
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);

  const ETHRouterContract = useETHRouter();
  const assetContract = useERC20();

  const marketContract = useMarket(market?.value);

  const rawSlippage = useMemo(() => 1 + Number(slippage) / 100, [slippage]);
  const { decimals = 18 } = useAccountData(symbol);

  const maxAmountToRepay = useMemo(
    () =>
      positionAssetsAmount
        .add(penaltyAssets)
        .mul(parseFixed(String(rawSlippage), 18))
        .div(WeiPerEther),
    [positionAssetsAmount, penaltyAssets, rawSlippage],
  );

  const walletBalance = useBalance(symbol, assetContract);

  const isLateRepay = useMemo(() => date && Date.now() / 1000 > parseInt(date.value), [date]);

  const totalPositionAssets = useMemo(() => {
    if (!accountData || !date) return Zero;
    const pool = accountData[symbol].fixedBorrowPositions.find(
      ({ maturity }) => maturity.toNumber().toString() === date.value,
    );

    return pool ? pool.position.principal.add(pool.position.fee) : Zero;
  }, [date, accountData, symbol]);

  const totalPenalties = useMemo(() => {
    if (!accountData || !date || !isLateRepay) return Zero;

    const { penaltyRate } = accountData[symbol];

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maturityTimestamp = parseFloat(date.value);
    const penaltyTime = currentTimestamp - maturityTimestamp;

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
      const maxAmount = maxAmountToRepay.isZero()
        ? DEFAULT_AMOUNT.mul(parseFixed(String(rawSlippage * 10), 18)).div(WeiPerEther)
        : maxAmountToRepay;

      if (symbol === 'WETH') {
        const gasLimit = await ETHRouterContract.estimateGas.repayAtMaturity(date.value, amount, {
          value: maxAmount,
        });

        return gasPrice.mul(gasLimit);
      }

      const gasLimit = await marketContract.estimateGas.repayAtMaturity(date.value, amount, maxAmount, walletAddress);

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
      rawSlippage,
      symbol,
      approveEstimateGas,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const handleOnMax = useCallback(() => {
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
        const gasEstimation = await ETHRouterContract.estimateGas.repayAtMaturity(date.value, positionAssetsAmount, {
          value: maxAmountToRepay,
        });

        repayTx = await ETHRouterContract.repayAtMaturity(date.value, positionAssetsAmount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          value: maxAmountToRepay,
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.repayAtMaturity(
          date.value,
          positionAssetsAmount,
          maxAmountToRepay,
          walletAddress,
        );

        repayTx = await marketContract.repayAtMaturity(
          date.value,
          positionAssetsAmount,
          maxAmountToRepay,
          walletAddress,
          {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          },
        );
      }

      setTx({ status: 'processing', hash: repayTx?.hash });

      const { status, transactionHash } = await repayTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'repayAtMaturity' : 'repayAtMaturityRevert', {
        amount: qty,
        asset: symbol,
        maturity: date.value,
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
      maturity: date?.value,
      asset: symbol,
    });

    return repay();
  }, [approve, date?.value, isLoading, needsApproval, qty, repay, requiresApproval, setRequiresApproval, symbol]);

  if (tx) return <ModalGif tx={tx} tryAgain={repay} />;

  return (
    <>
      <ModalTitle title={isLateRepay ? translations[lang].lateRepay : translations[lang].earlyRepay} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={formatFixed(totalPositionAssets, decimals)}
        amountTitle={translations[lang].debtAmount.toUpperCase()}
      />
      <ModalMaturityEditable text={translations[lang].maturityPool} line />
      <ModalInput
        onMax={handleOnMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow
        text={translations[lang].amountAtFinish}
        value={formatNumber(formatFixed(totalPositionAssets, decimals), symbol, true)}
        asset={symbol}
        line
      />
      {isLateRepay && (
        <ModalRow
          text="Penalties to be paid"
          value={formatNumber(formatFixed(penaltyAssets, decimals), symbol, true)}
          asset={symbol}
          line
        />
      )}
      <ModalRow
        text="Assets to be paid"
        value={formatNumber(formatFixed(positionAssetsAmount, decimals), symbol, true)}
        asset={symbol}
        line
      />
      <ModalRowEditable
        value={slippage}
        editable={isSlippageEditable}
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
          setSlippage(value);
        }}
        symbol="%"
        onClick={() => {
          if (!slippage) setSlippage(DEFAULT_SLIPPAGE);
          setIsSlippageEditable((prev) => !prev);
        }}
        line
      />
      <ModalRow
        text="Max amount to be paid"
        value={formatNumber(formatFixed(maxAmountToRepay, decimals), symbol, true)}
        asset={symbol}
        line
      />
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="repay" />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="repay" line />
      {errorData && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        variant="contained"
        color="primary"
        onClick={handleSubmitAction}
        loading={isLoading}
        disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
      >
        {requiresApproval ? 'Approve' : translations[lang].repay}
      </LoadingButton>
    </>
  );
};

export default React.memo(RepayAtMaturity);
