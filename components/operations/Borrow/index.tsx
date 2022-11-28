import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';

import { getSymbol } from 'utils/utils';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import useETHRouter from 'hooks/useETHRouter';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
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

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const Borrow: FC = () => {
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
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const ETHRouterContract = useETHRouter();

  const marketContract = useMarket(market?.value);

  const symbol = useMemo(
    () => (market?.value ? getSymbol(market.value, network?.name) : 'DAI'),
    [market?.value, network?.name],
  );

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => setAssetAddress(await marketContract.asset());

    loadAssetAddress().catch(handleOperationError);
  }, [marketContract, symbol]);

  const assetContract = useERC20(assetAddress);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(marketContract, ETHRouterContract?.address);

  const isLoading = useMemo(() => approveIsLoading || isLoadingOp, [approveIsLoading, isLoadingOp]);

  const walletBalance = useBalance(symbol, assetContract);

  const liquidity = useMemo(() => {
    if (!accountData) return undefined;

    const limit = accountData[symbol].floatingAvailableAssets;
    return limit ?? undefined;
  }, [accountData, symbol]);

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol]);

  const hasCollateral = useMemo(() => {
    if (!accountData) return false;

    return (
      // hasDepositedToFloatingPool
      accountData[symbol].floatingDepositAssets.gt(Zero) ||
      Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral)
    );
  }, [accountData, symbol]);

  const needsApproval = useCallback(async () => {
    if (symbol !== 'WETH') return false;
    if (!walletAddress || !ETHRouterContract || !marketContract) return true;

    const allowance = await marketContract.allowance(walletAddress, ETHRouterContract.address);
    return allowance.lt(parseFixed(qty || '0', 18));
  }, [ETHRouterContract, marketContract, qty, symbol, walletAddress]);

  useEffect(() => {
    needsApproval()
      .then(setNeedsAllowance)
      .catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [needsApproval]);

  const previewGasCost = useCallback(async () => {
    if (isLoading || !walletAddress || !marketContract || !ETHRouterContract || !qty) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation?.mul(gasPrice));
    }

    if (symbol === 'WETH') {
      const gasEstimation = await ETHRouterContract.estimateGas.borrow(qty ? parseFixed(qty, 18) : DEFAULT_AMOUNT);
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const decimals = await marketContract.decimals();
    const gasEstimation = await marketContract.estimateGas.borrow(
      qty ? parseFixed(qty, decimals) : DEFAULT_AMOUNT,
      walletAddress,
      walletAddress,
    );
    setGasCost(gasPrice.mul(gasEstimation));
  }, [isLoading, ETHRouterContract, approveEstimateGas, qty, marketContract, needsApproval, symbol, walletAddress]);

  useEffect(() => {
    if (errorData?.status) return;
    previewGasCost().catch((error) => {
      setErrorData({
        status: true,
        message: handleOperationError(error),
        component: 'gas',
      });
    });
  }, [previewGasCost, errorData?.status]);

  const onMax = useCallback(() => {
    if (!accountData || !healthFactor) return;

    const decimals = accountData[symbol].decimals;
    const adjustFactor = accountData[symbol].adjustFactor;
    const usdPrice = accountData[symbol].usdPrice;

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);
    const WAD = parseFixed('1', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(accountData[symbol].floatingDepositAssets, decimals)) > 0;

    if (!accountData[symbol].isCollateral && hasDepositedToFloatingPool) {
      col = col.add(accountData[symbol].floatingDepositAssets.mul(accountData[symbol].adjustFactor).div(WAD));
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
  }, [symbol, accountData, healthFactor]);

  const handleInputChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      if (!liquidity || !accountData) return;

      const { decimals, usdPrice } = accountData[symbol];

      const maxBorrowAssets = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, 'borrow');

      if (value.includes('.')) {
        const regex = /[^,.]*$/g;
        const inputDecimals = regex.exec(value)![0];
        if (inputDecimals.length > decimals) return;
      }
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
    [accountData, hasCollateral, lang, liquidity, translations, symbol],
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

      getAccountData();
    } catch (error: any) {
      if (borrowTx?.hash) setTx({ status: 'error', hash: borrowTx.hash });

      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    } finally {
      setIsLoadingOp(false);
    }
  }, [ETHRouterContract, accountData, getAccountData, marketContract, qty, symbol, walletAddress]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      setNeedsAllowance(await needsApproval());
      return;
    }

    void analytics.track('borrowRequest', {
      amount: qty,
      asset: symbol,
    });

    return borrow();
  }, [approve, approveErrorData, borrow, isLoading, needsAllowance, needsApproval, qty, symbol]);

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
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="borrow" healthFactorCallback={setHealthFactor} />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="borrow" line />
      {errorData && <ModalError message={errorData.message} />}
      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={!qty || parseFloat(qty) <= 0 || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].borrow}
      </LoadingButton>
    </>
  );
};

export default Borrow;
