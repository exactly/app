import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { ErrorCode } from '@ethersproject/logger';
import { captureException } from '@sentry/nextjs';

import LoadingButton from '@mui/lab/LoadingButton';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';

import { getSymbol } from 'utils/utils';
import formatNumber from 'utils/formatNumber';

import useDebounce from 'hooks/useDebounce';
import useETHRouter from 'hooks/useETHRouter';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import ErrorInterface from 'utils/ErrorInterface';

import keys from './translations.json';
import numbers from 'config/numbers.json';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useMarket from 'hooks/useMarket';
import useERC20 from 'hooks/useERC20';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Deposit: FC = () => {
  const { walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [isLoadingAllowance, setIsLoadingAllowance] = useState(true); // utility to avoid estimating gas immediately when switching assets
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const debounceQty = useDebounce(qty); // 1 seconds before estimating gas on qty change
  const ETHRouterContract = useETHRouter();

  const marketContract = useMarket(market?.value);

  const symbol = useMemo(
    () => (market?.value ? getSymbol(market.value, network?.name) : 'DAI'),
    [market?.value, network?.name],
  );

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => {
      setAssetAddress(await marketContract.asset());
    };
    void loadAssetAddress();
  }, [marketContract, symbol]);

  const assetContract = useERC20(assetAddress);

  const depositedAmount = useMemo(() => {
    if (!symbol || !accountData) return '0';

    const { floatingDepositAssets, decimals } = accountData[symbol];
    return formatNumber(formatFixed(floatingDepositAssets, decimals), symbol);
  }, [accountData, symbol]);

  // set qty to '' when symbol changes
  useEffect(() => {
    setQty('');
  }, [symbol]);

  const walletBalance = useBalance(symbol, assetContract);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(assetContract, marketContract?.address);

  const updateNeedsAllowance = useCallback(async () => {
    setIsLoadingAllowance(true);
    try {
      if (symbol === 'WETH') {
        setNeedsAllowance(false);
        return;
      }

      if (!walletAddress || !assetContract || !marketContract || !accountData) return setNeedsAllowance(true);
      const decimals = await assetContract.decimals();
      const allowance = await assetContract.allowance(walletAddress, marketContract.address);

      setNeedsAllowance(allowance.lt(parseFixed(qty || String(numbers.defaultAmount), decimals)));
    } catch (error) {
      captureException(error);
      setNeedsAllowance(true);
    } finally {
      setIsLoadingAllowance(false);
    }
  }, [accountData, assetContract, marketContract, qty, symbol, walletAddress]);

  // execute updateNeedsAllowance on first render
  useEffect(() => {
    updateNeedsAllowance().catch(captureException);
  }, [updateNeedsAllowance]);

  const step = useMemo(() => {
    return needsAllowance || isLoadingAllowance ? 1 : 2;
  }, [needsAllowance, isLoadingAllowance]);

  const previewGasCost = useCallback(async () => {
    if (isLoadingAllowance || !symbol || !walletAddress || !ETHRouterContract || !marketContract || !assetContract)
      return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (needsAllowance) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasEstimation.mul(gasPrice) : undefined);
    }

    if (symbol === 'WETH') {
      const gasLimit = await ETHRouterContract.estimateGas.deposit({
        value: debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      });

      return setGasCost(gasPrice.mul(gasLimit));
    }

    if (!marketContract) throw new Error('Market contract is undefined');

    const decimals = await marketContract.decimals();
    const gasLimit = await marketContract.estimateGas.deposit(
      debounceQty ? parseFixed(debounceQty, decimals) : DEFAULT_AMOUNT,
      walletAddress,
    );

    setGasCost(gasPrice.mul(gasLimit));
  }, [
    ETHRouterContract,
    approveEstimateGas,
    assetContract,
    debounceQty,
    isLoadingAllowance,
    marketContract,
    needsAllowance,
    symbol,
    walletAddress,
  ]);

  useEffect(() => {
    previewGasCost().catch((error) => {
      captureException(error);
      setErrorData({
        status: true,
        message: translations[lang].error,
        component: 'gas',
      });
    });
  }, [lang, previewGasCost, translations]);

  const onMax = () => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  };

  const handleInputChange = ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
    if (!accountData || !symbol) return;
    const { decimals } = accountData[symbol];

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
        component: 'input',
      });
    }
  };

  const deposit = useCallback(async () => {
    if (!walletAddress) return;
    let depositTx;
    try {
      setIsLoadingOp(true);
      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.deposit({ value: parseFixed(qty, 18) });

        depositTx = await ETHRouterContract.deposit({
          value: parseFixed(qty, 18),
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract) throw new Error('Market contract is undefined');
        const decimals = await marketContract.decimals();
        const depositAmount = parseFixed(qty, decimals);
        const gasEstimation = await marketContract.estimateGas.deposit(depositAmount, walletAddress);

        depositTx = await marketContract.deposit(depositAmount, walletAddress, {
          gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      getAccountData();
    } catch (error: any) {
      switch (error?.code) {
        case ErrorCode.ACTION_REJECTED:
          setErrorData({ status: true, message: translations[lang].deniedTransaction });
          return;
        case ErrorCode.UNPREDICTABLE_GAS_LIMIT: {
          const { name, args } = ErrorInterface.parseError(error.error.data.originalError.data);
          switch (name) {
            case 'InsufficientAccountLiquidity':
              setErrorData({ status: true, message: translations[lang].generalError });
              return;
            case 'Error':
              switch (args[0]) {
                case 'TRANSFER_FROM_FAILED':
                  setErrorData({ status: true, message: translations[lang].generalError });
                  return;
              }
          }
        }
      }

      captureException(error);
      if (depositTx) return setTx({ status: 'error', hash: depositTx.hash });
      setErrorData({ status: true, message: translations[lang].generalError });
    } finally {
      setIsLoadingOp(false);
    }
  }, [ETHRouterContract, getAccountData, lang, marketContract, qty, symbol, translations, walletAddress]);

  const isLoading = useMemo(
    () => approveIsLoading || isLoadingOp || isLoadingAllowance,
    [approveIsLoading, isLoadingAllowance, isLoadingOp],
  );

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      void updateNeedsAllowance();
      return;
    }
    return deposit();
  }, [approve, approveErrorData, deposit, isLoading, needsAllowance, updateNeedsAllowance]);

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

  return (
    <>
      <ModalTitle title={translations[lang].variableRateDeposit} />
      <ModalAsset
        asset={symbol!}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={walletBalance}
        amountTitle={translations[lang].walletBalance.toUpperCase()}
      />
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol!}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow text={translations[lang].exactlyBalance} value={depositedAmount} line />
      {symbol ? (
        <ModalRowHealthFactor qty={qty} symbol={symbol} operation="deposit" />
      ) : (
        <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
      )}
      <ModalRowBorrowLimit qty={qty} symbol={symbol!} operation="deposit" line />
      <ModalStepper currentStep={step} totalSteps={3} />
      {errorData && errorData.component !== 'gas' && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={!qty || parseFloat(qty) <= 0 || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].deposit}
      </LoadingButton>
    </>
  );
};

export default Deposit;
