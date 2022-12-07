import React, { ChangeEvent, FC, useCallback, useContext, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import formatNumber from 'utils/formatNumber';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import { WeiPerEther } from '@ethersproject/constants';
import handleOperationError from 'utils/handleOperationError';
import useApprove from 'hooks/useApprove';
import { LoadingButton } from '@mui/lab';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Withdraw: FC = () => {
  const { walletAddress } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

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

  const [isMax, setIsMax] = useState(false);

  const assets = useMemo(() => {
    if (!accountData) return;
    return accountData[symbol].floatingDepositAssets;
  }, [symbol, accountData]);

  const [parsedAmount, formattedAmount] = useMemo(() => {
    if (!assets || !accountData) return ['0', '0'];
    const amount = formatFixed(assets, accountData[symbol].decimals);
    return [amount, formatNumber(amount, symbol)];
  }, [accountData, assets, symbol]);

  const ETHRouterContract = useETHRouter();
  const marketContract = useMarket(market?.value);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('withdraw', marketContract, ETHRouterContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !accountData || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      const { floatingDepositShares } = accountData[symbol];
      if (symbol === 'WETH') {
        const amount = isMax ? floatingDepositShares : quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT;
        const gasEstimation = await ETHRouterContract.estimateGas.redeem(amount);
        return gasPrice.mul(gasEstimation);
      }

      const decimals = await marketContract.decimals();
      const amount = isMax ? floatingDepositShares : quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT;
      const gasEstimation = await marketContract.estimateGas.redeem(amount, walletAddress, walletAddress);
      return gasPrice.mul(gasEstimation);
    },
    [
      ETHRouterContract,
      accountData,
      approveEstimateGas,
      isMax,
      marketContract,
      requiresApproval,
      symbol,
      walletAddress,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(() => {
    setQty(parsedAmount);
    setIsMax(true);
  }, [parsedAmount, setQty]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      setQty(value);

      if (valueAsNumber > parseFloat(parsedAmount)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
        });
      }

      setErrorData(undefined);
      setIsMax(false);
    },
    [lang, parsedAmount, setErrorData, setQty, translations],
  );

  const withdraw = useCallback(async () => {
    if (!accountData || !walletAddress || !marketContract) return;

    let withdrawTx;
    try {
      setIsLoadingOp(true);
      const { decimals, floatingDepositShares } = accountData[symbol];

      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const gasEstimation = await ETHRouterContract.estimateGas.redeem(floatingDepositShares);
          withdrawTx = await ETHRouterContract.redeem(floatingDepositShares, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await ETHRouterContract.estimateGas.withdraw(parseFixed(qty, 18));
          withdrawTx = await ETHRouterContract.withdraw(parseFixed(qty, 18), {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        }
      } else {
        if (isMax) {
          const gasEstimation = await marketContract.estimateGas.redeem(
            floatingDepositShares,
            walletAddress,
            walletAddress,
          );

          withdrawTx = await marketContract.redeem(floatingDepositShares, walletAddress, walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await marketContract.estimateGas.withdraw(
            parseFixed(qty, decimals),
            walletAddress,
            walletAddress,
          );

          withdrawTx = await marketContract.withdraw(parseFixed(qty, decimals), walletAddress, walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        }
      }

      setTx({ status: 'processing', hash: withdrawTx?.hash });

      const { status, transactionHash } = await withdrawTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'withdraw' : 'withdrawRevert', {
        amount: qty,
        asset: symbol,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error: any) {
      if (withdrawTx) setTx({ status: 'error', hash: withdrawTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    getAccountData,
    isMax,
    marketContract,
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

    void analytics.track('withdrawRequest', {
      amount: qty,
      asset: symbol,
    });

    return withdraw();
  }, [approve, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol, withdraw]);

  if (tx) return <ModalGif tx={tx} tryAgain={withdraw} />;

  return (
    <>
      <ModalTitle title={translations[lang].withdraw} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={parsedAmount}
        amountTitle={translations[lang].depositedAmount.toUpperCase()}
      />
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow text={translations[lang].exactlyBalance} value={formattedAmount} line />
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="withdraw" />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="withdraw" line />
      {errorData && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
      >
        {requiresApproval ? translations[lang].approve : translations[lang].withdraw}
      </LoadingButton>
    </>
  );
};

export default React.memo(Withdraw);
