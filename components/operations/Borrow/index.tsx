import React, { type ChangeEvent, type FC, useCallback, useContext, useMemo } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import LoadingButton from '@mui/lab/LoadingButton';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import useETHRouter from 'hooks/useETHRouter';

import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';
import numbers from 'config/numbers.json';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useMarket from 'hooks/useMarket';
import useERC20 from 'hooks/useERC20';
import handleOperationError from 'utils/handleOperationError';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import getHealthFactorData from 'utils/getHealthFactorData';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Borrow: FC = () => {
  const { walletAddress } = useWeb3();
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

  const healthFactor = useMemo<HealthFactor | undefined>(
    () => (accountData ? getHealthFactorData(accountData) : undefined),
    [accountData],
  );

  const ETHRouterContract = useETHRouter();
  const assetContract = useERC20();

  const marketContract = useMarket(market);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('borrow', marketContract, ETHRouterContract?.address);

  const walletBalance = useBalance(symbol, assetContract);

  const liquidity = useMemo(() => {
    if (!accountData) return undefined;

    const limit = accountData[symbol].floatingAvailableAssets;
    return limit ?? undefined;
  }, [accountData, symbol]);

  const hasCollateral = useMemo(() => {
    if (!accountData) return false;

    return (
      // hasDepositedToFloatingPool
      accountData[symbol].floatingDepositAssets.gt(Zero) ||
      Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral)
    );
  }, [accountData, symbol]);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (symbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(
          quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT,
        );
        return gasPrice.mul(gasEstimation);
      }

      const decimals = await marketContract.decimals();
      const gasEstimation = await marketContract.estimateGas.borrow(
        quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT,
        walletAddress,
        walletAddress,
      );
      return gasPrice.mul(gasEstimation);
    },
    [walletAddress, marketContract, ETHRouterContract, requiresApproval, symbol, approveEstimateGas],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(() => {
    if (!accountData || !healthFactor) return;

    const { decimals, adjustFactor, usdPrice, floatingDepositAssets, isCollateral } = accountData[symbol];

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);
    const WAD = parseFixed('1', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(floatingDepositAssets, decimals)) > 0;

    if (!isCollateral && hasDepositedToFloatingPool) {
      col = col.add(floatingDepositAssets.mul(adjustFactor).div(WAD));
    }

    const debt = healthFactor.debt;

    const safeMaximumBorrow = Number(
      formatFixed(
        col.sub(hf.mul(debt).div(WAD)).mul(WAD).div(hf).mul(WAD).div(usdPrice).mul(adjustFactor).div(WAD),
        18,
      ),
    ).toFixed(decimals);

    setQty(safeMaximumBorrow);
    setErrorData(undefined);
  }, [accountData, healthFactor, symbol, setQty, setErrorData]);

  const handleInputChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      if (!liquidity || !accountData) return;

      const { decimals, usdPrice } = accountData[symbol];

      const maxBorrowAssets = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, 'borrow');

      setQty(value);

      if (!hasCollateral) return setErrorData({ status: true, message: translations[lang].noCollateral });

      if (liquidity.lt(parseFixed(value || '0', decimals))) {
        return setErrorData({
          status: true,
          message: translations[lang].availableLiquidityError,
        });
      }

      if (
        maxBorrowAssets.lt(
          parseFixed(value || '0', decimals)
            .mul(usdPrice)
            .div(WeiPerEther),
        )
      ) {
        return setErrorData({
          status: true,
          message: translations[lang].borrowLimit,
        });
      }
      setErrorData(undefined);
    },
    [liquidity, accountData, symbol, setQty, hasCollateral, setErrorData, translations, lang],
  );

  const borrow = useCallback(async () => {
    if (!accountData) return;

    setIsLoadingOp(true);
    let borrowTx;

    try {
      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        const amount = parseFixed(qty, 18);
        const gasEstimation = await ETHRouterContract.estimateGas.borrow(amount);
        borrowTx = await ETHRouterContract.borrow(amount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract || !walletAddress) return;

        const decimals = await marketContract.decimals();
        const amount = parseFixed(qty, decimals);
        const gasEstimation = await marketContract.estimateGas.borrow(amount, walletAddress, walletAddress);
        borrowTx = await marketContract.borrow(amount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: borrowTx.hash });

      const { status, transactionHash } = await borrowTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'borrow' : 'borrowRevert', {
        amount: qty,
        asset: symbol,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error: any) {
      if (borrowTx?.hash) setTx({ status: 'error', hash: borrowTx.hash });

      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    getAccountData,
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

    void analytics.track('borrowRequest', {
      amount: qty,
      asset: symbol,
    });

    return borrow();
  }, [approve, borrow, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol]);

  if (tx) return <ModalGif tx={tx} tryAgain={borrow} />;

  return (
    <>
      <ModalTitle title={translations[lang].floatingPoolBorrow} />
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
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="borrow" />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="borrow" line />
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
        {requiresApproval ? translations[lang].approve : translations[lang].borrow}
      </LoadingButton>
    </>
  );
};

export default React.memo(Borrow);
