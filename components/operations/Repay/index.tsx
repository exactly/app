import React, { ChangeEvent, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { LoadingButton } from '@mui/lab';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import SkeletonModalRowBeforeAfter from 'components/common/skeletons/SkeletonModalRowBeforeAfter';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';

import { getSymbol } from 'utils/utils';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useApprove from 'hooks/useApprove';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import handleOperationError from 'utils/handleOperationError';
import useERC20 from 'hooks/useERC20';
import useDebounce from 'hooks/useDebounce';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

function Repay() {
  const { walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');

  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [isLoadingOp, setIsLoadingOp] = useState<boolean>(false);
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [isMax, setIsMax] = useState<boolean>(false);
  const [errorData, setErrorData] = useState<ErrorData | undefined>(undefined);
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const debounceQty = useDebounce(qty);
  const ETHRouterContract = useETHRouter();

  const marketContract = useMarket(market?.value);
  const assetContract = useERC20(assetAddress);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => {
      setAssetAddress(await marketContract.asset());
    };
    void loadAssetAddress();
  }, [marketContract, symbol]);

  const assets = useMemo(() => accountData?.[symbol].floatingBorrowAssets, [symbol, accountData]);

  const finalAmount = useMemo(() => {
    if (!assets || !symbol || !accountData) return '0';

    return formatFixed(assets, accountData[symbol].decimals);
  }, [assets, symbol]);

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(assetContract, marketContract?.address);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const needsApproval = useCallback(async () => {
    if (symbol === 'WETH') return false;

    if (!walletAddress || !assetContract || !marketContract || !accountData) return true;

    const decimals = await assetContract.decimals();
    const allowance = await assetContract.allowance(walletAddress, marketContract.address);
    return allowance.lt(parseFixed(qty || String(numbers.defaultAmount), decimals));
  }, [accountData, assetContract, marketContract, qty, symbol, walletAddress]);

  useEffect(() => {
    needsApproval()
      .then(setNeedsAllowance)
      .catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [needsApproval]);

  const onMax = useCallback(() => {
    setQty(finalAmount);

    //we enable max flag if user clicks max
    setIsMax(true);
  }, [setQty, finalAmount, setIsMax]);

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setQty(e.target.value);

    //we disable max flag if user changes input
    isMax && setIsMax(false);
  }

  async function repay() {
    if (!accountData || !qty || !marketContract || !walletAddress) return;

    let repayTx;
    try {
      setIsLoadingOp(true);
      const { decimals, floatingBorrowShares } = accountData[symbol];

      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        if (isMax) {
          const gasEstimation = await ETHRouterContract.estimateGas.refund(floatingBorrowShares);

          repayTx = await ETHRouterContract.refund(floatingBorrowShares, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await ETHRouterContract.estimateGas.repay(floatingBorrowShares);

          repayTx = await ETHRouterContract.repay(floatingBorrowShares, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        }
      } else {
        if (isMax) {
          const gasEstimation = await marketContract.estimateGas.refund(floatingBorrowShares, walletAddress);

          repayTx = await marketContract.refund(floatingBorrowShares, walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        } else {
          const gasEstimation = await marketContract.estimateGas.repay(parseFixed(qty, decimals), walletAddress);
          repayTx = await marketContract.repay(parseFixed(qty!, decimals), walletAddress, {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          });
        }
      }

      setTx({ status: 'processing', hash: repayTx?.hash });

      const { status, transactionHash } = await repayTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      getAccountData();
    } catch (error: any) {
      if (repayTx) setTx({ status: 'error', hash: repayTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }

  const previewGasCost = useCallback(async () => {
    if (isLoading || !symbol || !walletAddress || !ETHRouterContract || !marketContract || !assetContract) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation ? gasEstimation.mul(gasPrice) : undefined);
    }

    if (symbol === 'WETH') {
      const gasLimit = await ETHRouterContract.estimateGas.deposit({
        value: debounceQty ? parseFixed(debounceQty, 18) : DEFAULT_AMOUNT,
      });

      return setGasCost(gasPrice.mul(gasLimit));
    }

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
    isLoading,
    marketContract,
    needsApproval,
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
    // check needs allowance
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
      <ModalTitle title={translations[lang].lateRepay} />
      <ModalAsset
        asset={symbol!}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={finalAmount}
        amountTitle={translations[lang].debtAmount.toUpperCase()}
      />
      <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol!} />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      {symbol ? (
        <ModalRowHealthFactor qty={qty} symbol={symbol} operation="repay" />
      ) : (
        <SkeletonModalRowBeforeAfter text={translations[lang].healthFactor} />
      )}
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
        {needsAllowance ? translations[lang].approval : translations[lang].repay}
      </LoadingButton>
    </>
  );
}

export default Repay;
