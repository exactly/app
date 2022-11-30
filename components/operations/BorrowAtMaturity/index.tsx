import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { ErrorCode } from '@ethersproject/logger';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import { captureException } from '@sentry/nextjs';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRowHealthFactor from 'components/common/modal/ModalRowHealthFactor';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalError from 'components/common/modal/ModalError';
import ModalRowBorrowLimit from 'components/common/modal/ModalRowBorrowLimit';
import ModalRowUtilizationRate from 'components/common/modal/ModalRowUtilizationRate';
import ModalCell from 'components/common/modal/ModalCell';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';
import { HealthFactor } from 'types/HealthFactor';
import { FixedPool } from 'types/FixedLenderAccountData';

import { getSymbol, toPercentage } from 'utils/utils';
import getOneDollar from 'utils/getOneDollar';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import useETHRouter from 'hooks/useETHRouter';
import useMarket from 'hooks/useMarket';
import useBalance from 'hooks/useBalance';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import useApprove from 'hooks/useApprove';
import usePreviewer from 'hooks/usePreviewer';
import useERC20 from 'hooks/useERC20';

import keys from './translations.json';

import numbers from 'config/numbers.json';
import handleOperationError from 'utils/handleOperationError';
import analytics from 'utils/analytics';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const BorrowAtMaturity: FC = () => {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { date, market } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [fixedRate, setFixedRate] = useState<number | undefined>();
  const [slippage, setSlippage] = useState<number>(numbers.slippage);
  const [isSlippageEditable, setIsSlippageEditable] = useState(false);
  const [isLoadingOp, setIsLoadingOp] = useState(false);
  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>();
  const [urBefore, setUrBefore] = useState<string | undefined>();
  const [urAfter, setUrAfter] = useState<string | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const ETHRouterContract = useETHRouter();
  const marketContract = useMarket(market?.value);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    errorData: approveErrorData,
    isLoading: approveIsLoading,
  } = useApprove(marketContract, ETHRouterContract?.address);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [approveIsLoading, isLoadingOp]);

  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => setAssetAddress(await marketContract.asset());

    loadAssetAddress().catch(captureException);
  }, [marketContract, symbol, web3Provider]);

  const assetContract = useERC20(assetAddress);

  const walletBalance = useBalance(symbol, assetContract);
  const poolLiquidity = usePoolLiquidity(symbol);

  // check has collateral
  useEffect(() => {
    if (!accountData) return;

    const hasCollateral =
      // isCollateral
      accountData[symbol].floatingDepositAssets.gt(Zero) ||
      // hasDepositedToFloatingPool
      Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral);

    if (!hasCollateral) {
      setErrorData({
        status: true,
        message: translations[lang].noCollateral,
      });
    }
  }, [accountData, lang, symbol, translations]);

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol, date]);

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
    if (isLoading || !walletAddress || !marketContract || !ETHRouterContract || !date || !qty) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation?.mul(gasPrice));
    }

    if (symbol === 'WETH') {
      const amount = qty ? parseFixed(qty, 18) : DEFAULT_AMOUNT;
      const maxAmount = amount.mul(parseFixed(String(1 + slippage), 18)).div(WeiPerEther);

      const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date.value, amount, maxAmount);

      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const decimals = await marketContract.decimals();
    const amount = qty ? parseFixed(qty, decimals) : DEFAULT_AMOUNT;
    const maxAmount = amount.mul(parseFixed(String(1 + slippage), 18)).div(WeiPerEther);
    const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(
      date.value,
      amount,
      maxAmount,
      walletAddress,
      walletAddress,
    );
    setGasCost(gasPrice.mul(gasEstimation));
  }, [
    isLoading,
    ETHRouterContract,
    approveEstimateGas,
    date,
    qty,
    marketContract,
    needsApproval,
    slippage,
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
  }, [previewGasCost, errorData?.status]);

  const onMax = useCallback(() => {
    if (!accountData || !healthFactor) return;

    const { decimals, usdPrice, adjustFactor, floatingDepositAssets } = accountData[symbol];

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(floatingDepositAssets, decimals)) > 0;

    if (!accountData[symbol].isCollateral && hasDepositedToFloatingPool) {
      col = col.add(floatingDepositAssets.mul(adjustFactor).div(WeiPerEther));
    }

    const { debt } = healthFactor;

    const safeMaximumBorrow = Number(
      formatFixed(
        col
          .sub(hf.mul(debt).div(WeiPerEther))
          .mul(WeiPerEther)
          .div(hf)
          .mul(WeiPerEther)
          .div(usdPrice)
          .mul(adjustFactor)
          .div(WeiPerEther),
        18,
      ),
    ).toFixed(decimals);

    setQty(safeMaximumBorrow);
    setErrorData(undefined);
  }, [accountData, healthFactor, symbol]);

  const handleInputChange = useCallback(
    ({ target: { value, valueAsNumber } }: ChangeEvent<HTMLInputElement>) => {
      if (!accountData) return;
      const { decimals, usdPrice } = accountData[symbol];

      setQty(value);

      if (poolLiquidity && poolLiquidity < valueAsNumber) {
        return setErrorData({
          status: true,
          message: translations[lang].availableLiquidityError,
        });
      }

      const maxBorrowAssets = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, 'borrow');

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
    [accountData, lang, translations, symbol, poolLiquidity],
  );

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && slippage < fixedRate) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: translations[lang].notEnoughSlippage,
      });
    }

    if (!accountData || !date || !qty || !walletAddress) return;

    const { decimals } = accountData[symbol];
    const amount = parseFixed(qty, decimals);
    const maxAmount = amount.mul(parseFixed(String(1 + slippage), 18)).div(WeiPerEther);

    let borrowTx;
    try {
      if (symbol === 'WETH') {
        if (!ETHRouterContract) throw new Error('ETHRouterContract is undefined');

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date.value, amount, maxAmount);

        borrowTx = await ETHRouterContract.borrowAtMaturity(date.value, amount, maxAmount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract) return;

        const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(
          date.value,
          amount,
          maxAmount,
          walletAddress,
          walletAddress,
        );

        borrowTx = await marketContract.borrowAtMaturity(date.value, amount, maxAmount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: borrowTx?.hash });

      const { status, transactionHash } = await borrowTx.wait();
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'borrowAtMaturity' : 'borrowAtMaturityRevert', {
        amount: qty,
        asset: symbol,
        maturity: date.value,
        hash: transactionHash,
      });

      getAccountData();
    } catch (error: any) {
      if (error?.code === ErrorCode.ACTION_REJECTED) {
        return setErrorData({
          status: true,
          message: translations[lang].deniedTransaction,
        });
      }

      setTx({ status: 'error', hash: borrowTx?.hash });
      setErrorData({
        status: true,
        message: translations[lang].generalError,
      });
      captureException(error);
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    date,
    fixedRate,
    getAccountData,
    lang,
    marketContract,
    qty,
    slippage,
    symbol,
    translations,
    walletAddress,
  ]);

  const updateAPR = useCallback(async () => {
    if (!accountData || !date || !previewerContract || !marketContract) return;

    const { decimals, usdPrice } = accountData[symbol];

    const initialAssets = qty ? parseFixed(qty, decimals) : getOneDollar(usdPrice, decimals);

    try {
      const { assets: finalAssets } = await previewerContract.previewBorrowAtMaturity(
        marketContract.address,
        date.value,
        initialAssets,
      );

      const currentTimestamp = new Date().getTime() / 1000;
      const time = 31_536_000 / (Number(date.value) - currentTimestamp);

      const rate = finalAssets.mul(WeiPerEther).div(initialAssets);

      const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;
      const slippageAPR = fixedAPR * (1 + numbers.slippage);
      setSlippage(slippageAPR);
      setFixedRate(fixedAPR);
    } catch (error) {
      setFixedRate(undefined);
    }
  }, [accountData, date, qty, marketContract, previewerContract, symbol]);

  // update APR
  useEffect(() => {
    updateAPR().catch(captureException);
  }, [updateAPR]);

  // load initial utilization rate
  useEffect(() => {
    if (!accountData || !date) return;

    const { utilization: utBefore } = accountData[symbol].fixedPools.find(
      ({ maturity }) => maturity.toString() === date.value,
    ) as FixedPool;

    setUrBefore((Number(formatFixed(utBefore, 18)) * 100).toFixed(2));
  }, [accountData, date, symbol]);

  const updateURAfter = useCallback(async () => {
    if (!marketContract || !previewerContract || !date || !accountData) return;
    if (!qty) return setUrAfter(urBefore);

    try {
      const { decimals, usdPrice } = accountData[symbol];
      const initialAssets = qty ? parseFixed(qty, decimals) : getOneDollar(usdPrice, decimals);

      const { utilization } = await previewerContract.previewBorrowAtMaturity(
        marketContract.address,
        date.value,
        initialAssets,
      );

      setUrAfter((Number(formatFixed(utilization, 18)) * 100).toFixed(2));
    } catch (error) {
      setUrAfter('N/A');
    }
  }, [accountData, date, qty, marketContract, previewerContract, symbol, urBefore]);

  useEffect(() => {
    updateURAfter().catch(captureException);
  }, [updateURAfter]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (!needsAllowance) {
      void analytics.track('borrowAtMaturityRequest', {
        amount: qty,
        maturity: date?.value,
        asset: symbol,
      });

      return borrow();
    }

    await approve();
    setErrorData(approveErrorData);
    setNeedsAllowance(await needsApproval());
  }, [date?.value, qty, symbol, isLoading, needsAllowance, approve, approveErrorData, needsApproval, borrow]);

  if (tx) return <ModalGif tx={tx} tryAgain={borrow} />;

  return (
    <>
      <ModalTitle title={translations[lang].fixedRateBorrow} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={walletBalance}
        amountTitle={translations[lang].walletBalance.toUpperCase()}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px dashed #d9d9d9',
        }}
      >
        <ModalMaturityEditable text={translations[lang].maturityPool} />
        <ModalCell text={translations[lang].apr} value={toPercentage(fixedRate)} line />
      </Box>
      <ModalInput onMax={onMax} value={qty} onChange={handleInputChange} symbol={symbol} />
      {errorData?.component !== 'gas' && symbol !== 'WETH' && <ModalTxCost gasCost={gasCost} />}
      <ModalRowEditable
        text={translations[lang].maximumBorrowApr}
        value={toPercentage(slippage)}
        editable={isSlippageEditable}
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
          setSlippage(Number(value) / 100);
          errorData?.message === translations[lang].notEnoughSlippage && setErrorData(undefined);
        }}
        onClick={() => setIsSlippageEditable((prev) => !prev)}
        line
      />
      <ModalRowHealthFactor qty={qty} symbol={symbol} operation="borrow" healthFactorCallback={setHealthFactor} />
      <ModalRowBorrowLimit qty={qty} symbol={symbol} operation="borrow" line />
      <ModalRowUtilizationRate urBefore={urBefore} urAfter={urAfter} line />

      {errorData && <ModalError message={errorData.message} />}

      <LoadingButton
        fullWidth
        sx={{ mt: 2 }}
        loading={isLoading}
        onClick={handleSubmitAction}
        color="primary"
        variant="contained"
        disabled={parseFloat(qty) <= 0 || !qty || isLoading || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].borrow}
      </LoadingButton>
    </>
  );
};

export default BorrowAtMaturity;
