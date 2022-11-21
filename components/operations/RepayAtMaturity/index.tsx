import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

import { ErrorData } from 'types/Error';
import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';

import formatNumber from 'utils/formatNumber';
import { getSymbol } from 'utils/utils';

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

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const RepayAtMaturity: FC = () => {
  const { walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState('');

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isSlippageEditable, setIsSlippageEditable] = useState(false);
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [penaltyAssets, setPenaltyAssets] = useState(Zero);
  const [positionAssetsAmount, setPositionAssetsAmount] = useState(Zero);
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const ETHRouterContract = useETHRouter();

  const marketContract = useMarket(market?.value);
  const assetContract = useERC20(assetAddress);

  const symbol = useMemo(
    () => (market?.value ? getSymbol(market.value, network?.name) : 'DAI'),
    [market?.value, network?.name],
  );
  const rawSlippage = useMemo(() => 1 + Number(slippage) / 100, [slippage]);
  const decimals = useMemo(() => (accountData && accountData[symbol].decimals) || 18, [accountData, symbol]);

  const maxAmountToRepay = useMemo(
    () =>
      positionAssetsAmount
        .add(penaltyAssets)
        .mul(parseFixed(String(rawSlippage), 18))
        .div(WeiPerEther),
    [positionAssetsAmount, penaltyAssets, rawSlippage],
  );

  const walletBalance = useBalance(symbol, assetContract);

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => {
      setAssetAddress(await marketContract.asset());
    };
    void loadAssetAddress();
  }, [marketContract, symbol]);

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

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol, date]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(assetContract, marketContract?.address);

  const needsApproval = useCallback(async () => {
    if (symbol === 'WETH') return false;

    if (!walletAddress || !assetContract || !marketContract || !accountData) return true;

    const allowance = await assetContract.allowance(walletAddress, marketContract.address);
    return allowance.lt(parseFixed(qty || String(numbers.defaultAmount), await assetContract.decimals()));
  }, [accountData, assetContract, marketContract, qty, symbol, walletAddress]);

  useEffect(() => {
    needsApproval()
      .then(setNeedsAllowance)
      .catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [needsApproval]);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const previewGasCost = useCallback(async () => {
    if (isLoading || !walletAddress || !ETHRouterContract || !marketContract || !date) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasEstimation.mul(gasPrice) : undefined);
    }

    const amount = positionAssetsAmount.isZero() ? DEFAULT_AMOUNT : positionAssetsAmount;
    const maxAmount = maxAmountToRepay.isZero()
      ? DEFAULT_AMOUNT.mul(parseFixed(String(rawSlippage * 10), 18)).div(WeiPerEther)
      : maxAmountToRepay;

    if (symbol === 'WETH') {
      const gasLimit = await ETHRouterContract.estimateGas.repayAtMaturity(date.value, amount, {
        value: maxAmount,
      });

      return setGasCost(gasPrice.mul(gasLimit));
    }

    const gasLimit = await marketContract.estimateGas.repayAtMaturity(date.value, amount, maxAmount, walletAddress);

    setGasCost(gasPrice.mul(gasLimit));
  }, [
    ETHRouterContract,
    approveEstimateGas,
    date,
    isLoading,
    marketContract,
    maxAmountToRepay,
    needsApproval,
    positionAssetsAmount,
    rawSlippage,
    symbol,
    walletAddress,
  ]);

  useEffect(() => {
    if (errorData?.status) return;
    previewGasCost().catch((error) => {
      setErrorData({
        status: true,
        message: handleOperationError(error),
        component: 'gas',
      });
    });
  }, [lang, previewGasCost, translations, errorData?.status]);

  const handleOnMax = useCallback(() => {
    setPenaltyAssets(totalPenalties);
    setPositionAssetsAmount(totalPositionAssets);
    setQty(formatFixed(totalPositionAssets.add(totalPenalties), decimals));

    if (walletBalance && parseFixed(walletBalance, decimals).lt(totalPositionAssets.add(totalPenalties)))
      return setErrorData({ status: true, message: 'Insufficient balance' });

    setErrorData(undefined);
  }, [decimals, totalPositionAssets, totalPenalties, walletBalance]);

  const handleInputChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      if (value.includes('.')) {
        const regex = /[^,.]*$/g;
        const inputDecimals = regex.exec(value)![0];
        if (inputDecimals.length > decimals) return;
      }

      setQty(value);

      const input = parseFixed(value || '0', decimals);
      const newPositionAssetsAmount = input
        .mul(totalPositionAssets.mul(WeiPerEther).div(totalPositionAssets.add(totalPenalties)))
        .div(WeiPerEther);
      const newPenaltyAssets = input.sub(newPositionAssetsAmount);
      setPenaltyAssets(newPenaltyAssets);
      setPositionAssetsAmount(newPositionAssetsAmount);

      const totalAmount = newPenaltyAssets.add(newPositionAssetsAmount);
      if (walletBalance && parseFixed(walletBalance, decimals).lt(totalAmount)) {
        return setErrorData({ status: true, message: 'Insufficient balance' });
      }

      setErrorData(undefined);
    },
    [decimals, totalPositionAssets, totalPenalties, walletBalance],
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

      getAccountData();
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
    symbol,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      setNeedsAllowance(await needsApproval());
      return;
    }

    return repay();
  }, [approve, approveErrorData, isLoading, needsAllowance, needsApproval, repay]);

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
      <ModalInput onMax={handleOnMax} value={qty} onChange={handleInputChange} symbol={symbol} />
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
        {needsAllowance ? 'Approve' : translations[lang].repay}
      </LoadingButton>
    </>
  );
};

export default RepayAtMaturity;
