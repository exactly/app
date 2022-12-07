import React, { ChangeEvent, FC, useCallback, useContext, useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import LoadingButton from '@mui/lab/LoadingButton';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';

import formatNumber from 'utils/formatNumber';

import useETHRouter from 'hooks/useETHRouter';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import keys from './translations.json';
import numbers from 'config/numbers.json';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useMarket from 'hooks/useMarket';
import useERC20 from 'hooks/useERC20';
import handleOperationError from 'utils/handleOperationError';
import analytics from 'utils/analytics';
import useAccountData from 'hooks/useAccountData';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Deposit: FC = () => {
  const { walletAddress } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

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

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const ETHRouterContract = useETHRouter();
  const assetContract = useERC20();
  const marketContract = useMarket(market?.value);

  const { decimals = 18 } = useAccountData(symbol);

  const depositedAmount = useMemo(() => {
    if (!symbol || !accountData) return '0';

    const { floatingDepositAssets } = accountData[symbol];
    return formatNumber(formatFixed(floatingDepositAssets, decimals), symbol);
  }, [accountData, symbol, decimals]);

  const walletBalance = useBalance(symbol, assetContract);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('deposit', assetContract, marketContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !ETHRouterContract || !marketContract) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (symbol === 'WETH') {
        const gasLimit = await ETHRouterContract.estimateGas.deposit({
          value: quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT,
        });

        return gasPrice.mul(gasLimit);
      }

      const gasLimit = await marketContract.estimateGas.deposit(
        quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT,
        walletAddress,
      );

      return gasPrice.mul(gasLimit);
    },
    [decimals, ETHRouterContract, approveEstimateGas, marketContract, requiresApproval, symbol, walletAddress],
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
  }, [walletBalance, setQty, setErrorData]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      setQty(value);

      if (walletBalance && valueAsNumber > parseFloat(walletBalance)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
          component: 'input',
        });
      }

      setErrorData(undefined);
    },
    [setQty, walletBalance, setErrorData, translations, lang],
  );

  const deposit = useCallback(async () => {
    if (!walletAddress || !marketContract) return;
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
        const depositAmount = parseFixed(qty, decimals);
        const gasEstimation = await marketContract.estimateGas.deposit(depositAmount, walletAddress);

        depositTx = await marketContract.deposit(depositAmount, walletAddress, {
          gasLimit: Math.ceil(Number(formatFixed(gasEstimation)) * numbers.gasLimitMultiplier),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'deposit' : 'depositRevert', {
        amount: qty,
        asset: symbol,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error: any) {
      if (depositTx) setTx({ status: 'error', hash: depositTx.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    walletAddress,
    marketContract,
    setIsLoadingOp,
    symbol,
    setTx,
    qty,
    getAccountData,
    ETHRouterContract,
    decimals,
    setErrorData,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('depositRequest', {
      amount: qty,
      asset: symbol,
    });

    return deposit();
  }, [isLoading, requiresApproval, qty, symbol, deposit, approve, setRequiresApproval, needsApproval]);

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

  return (
    <>
      <ModalTitle title={translations[lang].variableRateDeposit} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={walletBalance}
        amountTitle={translations[lang].walletBalance.toUpperCase()}
      />
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow text={translations[lang].exactlyBalance} value={depositedAmount} line />
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="deposit" />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="deposit" line />
      <ModalStepper currentStep={requiresApproval ? 1 : 2} totalSteps={3} />
      {errorData?.status && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
      >
        {requiresApproval ? translations[lang].approve : translations[lang].deposit}
      </LoadingButton>
    </>
  );
};

export default React.memo(Deposit);
