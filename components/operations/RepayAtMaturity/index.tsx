import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { LoadingButton } from '@mui/lab';

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

import useDebounce from 'hooks/useDebounce';

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
import usePreviewer from 'hooks/usePreviewer';
import handleOperationError from 'utils/handleOperationError';
import useBalance from 'hooks/useBalance';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = numbers.slippage.toFixed(2);

const RepayAtMaturity: FC = () => {
  const { walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const previewerContract = usePreviewer();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState('');

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isSlippageEditable, setIsSlippageEditable] = useState(false);
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [penaltyAssets, setPenaltyAssets] = useState(Zero);
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [previewerRepayAmount, setPreviewerRepayAmount] = useState(Zero);
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
      parseFixed(qty || '0', decimals)
        .add(penaltyAssets)
        .mul(parseFixed(String(rawSlippage), 18))
        .div(WeiPerEther),
    [decimals, penaltyAssets, qty, rawSlippage],
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

  const positionAssets = useMemo(() => {
    if (!accountData || !date) return Zero;
    const pool = accountData[symbol].fixedBorrowPositions.find(
      ({ maturity }) => maturity.toNumber().toString() === date.value,
    );

    return pool ? pool.position.principal.add(pool.position.fee) : Zero;
  }, [date, accountData, symbol]);

  const debounceQty = useDebounce(qty);

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

  const amountAtFinish = useMemo(() => {
    if (!accountData) return '0';

    return formatFixed(positionAssets, decimals);
  }, [accountData, positionAssets, decimals]);

  const calculatePenalties = useCallback(() => {
    if (!accountData || !date || !qty) return;

    const { penaltyRate } = accountData[symbol];

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maturityTimestamp = parseFloat(date.value);
    const penaltyTime = currentTimestamp - maturityTimestamp;

    const newPenaltyAssets = penaltyRate.mul(penaltyTime).mul(parseFixed(qty, decimals)).div(WeiPerEther);

    setPenaltyAssets(newPenaltyAssets);
  }, [accountData, date, qty, symbol, decimals]);

  const previewRepayAtMaturity = useCallback(async () => {
    if (!accountData || !date || !marketContract || !walletAddress || !previewerContract) return;

    if (!qty) return setPreviewerRepayAmount(Zero);

    const amountToRepay = await previewerContract.previewRepayAtMaturity(
      marketContract?.address,
      date.value,
      parseFixed(qty, decimals),
      walletAddress,
    );

    setPreviewerRepayAmount(amountToRepay);
  }, [accountData, date, decimals, marketContract, previewerContract, qty, walletAddress]);

  useEffect(() => {
    previewRepayAtMaturity().catch((error) => {
      setPreviewerRepayAmount(Zero);
      setErrorData({ status: true, message: handleOperationError(error) });
    });
    if (isLateRepay) calculatePenalties();
  }, [isLateRepay, debounceQty, calculatePenalties, previewRepayAtMaturity]);

  const onMax = useCallback(() => {
    setQty(amountAtFinish);

    if (walletBalance && parseFloat(amountAtFinish) > parseFloat(walletBalance)) {
      return setErrorData({
        status: true,
        message: translations[lang].insufficientBalance,
      });
    }

    setErrorData(undefined);
  }, [amountAtFinish, walletBalance, translations, lang]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      if (!accountData) return;

      if (value.includes('.')) {
        const regex = /[^,.]*$/g;
        const inputDecimals = regex.exec(value)![0];
        if (inputDecimals.length > decimals) return;
      }

      setQty(value);

      if (walletBalance && valueAsNumber > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
        });
      }
      setErrorData(undefined);
    },
    [accountData, walletBalance, decimals, translations, lang],
  );

  const repay = useCallback(async () => {
    if (!accountData || !date || !ETHRouterContract || !qty || !marketContract || !walletAddress) return;

    let repayTx;
    try {
      setIsLoadingOp(true);

      if (symbol === 'WETH') {
        const value = parseFixed(qty, 18)
          .mul(parseFixed(String(rawSlippage), 18))
          .div(WeiPerEther);
        const gasEstimation = await ETHRouterContract.estimateGas.repayAtMaturity(date.value, parseFixed(qty, 18), {
          value,
        });

        repayTx = await ETHRouterContract.repayAtMaturity(date.value, parseFixed(qty, 18), {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          value,
        });
      } else {
        const maxAmount = parseFixed(qty, decimals)
          .mul(parseFixed(String(rawSlippage), 18))
          .div(WeiPerEther);
        const gasEstimation = await marketContract.estimateGas.repayAtMaturity(
          date.value,
          parseFixed(qty, decimals),
          maxAmount,
          walletAddress,
        );

        repayTx = await marketContract.repayAtMaturity(
          date.value,
          parseFixed(qty, decimals),
          maxAmount,
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
    decimals,
    getAccountData,
    marketContract,
    qty,
    rawSlippage,
    symbol,
    walletAddress,
  ]);

  const previewGasCost = useCallback(async () => {
    if (isLoading || !walletAddress || !ETHRouterContract || !marketContract || !assetContract || !date) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasEstimation.mul(gasPrice) : undefined);
    }

    if (symbol === 'WETH') {
      const amount = debounceQty
        ? parseFixed(debounceQty, 18)
            .mul(parseFixed(String(rawSlippage), 18))
            .div(WeiPerEther)
        : DEFAULT_AMOUNT;

      const gasLimit = await ETHRouterContract.estimateGas.repayAtMaturity(date.value, amount);

      return setGasCost(gasPrice.mul(gasLimit));
    }

    const amount = debounceQty ? parseFixed(debounceQty, await marketContract.decimals()) : DEFAULT_AMOUNT;
    const maxAsset = amount.mul(parseFixed(String(rawSlippage), 18)).div(WeiPerEther);
    const gasLimit = await marketContract.estimateGas.repayAtMaturity(date.value, amount, maxAsset, walletAddress);

    setGasCost(gasPrice.mul(gasLimit));
  }, [
    ETHRouterContract,
    approveEstimateGas,
    assetContract,
    date,
    debounceQty,
    isLoading,
    marketContract,
    needsApproval,
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
        amount={amountAtFinish}
        amountTitle={translations[lang].debtAmount.toUpperCase()}
      />
      <ModalMaturityEditable text={translations[lang].maturityPool} line />
      <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol} />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow
        text={translations[lang].amountAtFinish}
        value={amountAtFinish && `${formatNumber(amountAtFinish, symbol, true)}`}
        asset={symbol}
        line
      />
      {isLateRepay && (
        <ModalRow
          text={translations[lang].penalties}
          value={formatNumber(formatFixed(penaltyAssets, decimals), symbol, true)}
          asset={symbol}
          line
        />
      )}
      <ModalRow
        text={translations[lang].amountToPay}
        value={formatNumber(formatFixed(previewerRepayAmount, decimals), symbol, true)}
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
