import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { ErrorCode } from '@ethersproject/logger';
import { captureException } from '@sentry/nextjs';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalError from 'components/common/modal/ModalError';
import ModalCell from 'components/common/modal/ModalCell';

import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { ErrorData } from 'types/Error';

import { getSymbol, toPercentage } from 'utils/utils';
import getOneDollar from 'utils/getOneDollar';

import numbers from 'config/numbers.json';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';
import useBalance from 'hooks/useBalance';
import useMarket from 'hooks/useMarket';
import useApprove from 'hooks/useApprove';
import useETHRouter from 'hooks/useETHRouter';
import usePreviewer from 'hooks/usePreviewer';
import useERC20 from 'hooks/useERC20';
import handleOperationError from 'utils/handleOperationError';
import analytics from 'utils/analytics';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const DepositAtMaturity: FC = () => {
  const { walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<string>('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [isLoadingOp, setIsLoadingOp] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [fixedRate, setFixedRate] = useState<number | undefined>(undefined);
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [errorData, setErrorData] = useState<ErrorData | undefined>(undefined);
  const [assetAddress, setAssetAddress] = useState<string | undefined>();

  const ETHRouterContract = useETHRouter();
  const marketContract = useMarket(market?.value);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  // load asset address
  useEffect(() => {
    if (!marketContract || symbol === 'WETH') return;

    const loadAssetAddress = async () => setAssetAddress(await marketContract.asset());

    loadAssetAddress().catch(captureException);
  }, [marketContract, symbol]);

  const assetContract = useERC20(assetAddress);

  const walletBalance = useBalance(symbol, assetContract);

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol, date]);

  const needsApproval = useCallback(async () => {
    if (symbol === 'WETH') return false;
    if (!marketContract || !assetContract || !walletAddress) return true;
    const allowance = await assetContract.allowance(walletAddress, marketContract.address);
    const decimals = await assetContract.decimals();
    return allowance.lt(parseFixed(qty || String(numbers.defaultAmount), decimals));
  }, [assetContract, qty, marketContract, symbol, walletAddress]);

  // load needs approval
  useEffect(() => {
    needsApproval()
      .then(setNeedsAllowance)
      .catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [needsApproval]);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(assetContract, marketContract?.address);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [approveIsLoading, isLoadingOp]);

  const previewGasCost = useCallback(async () => {
    if (isLoading || !walletAddress || !marketContract || !ETHRouterContract || !date) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation?.mul(gasPrice));
    }

    if (symbol === 'WETH') {
      const amount = qty ? parseFixed(qty, 18) : DEFAULT_AMOUNT;
      const minAmount = amount.mul(parseFixed(String(1 - slippage), 18)).div(WeiPerEther);
      const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date.value, minAmount, {
        value: amount,
      });
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const decimals = await marketContract.decimals();
    const amount = qty ? parseFixed(qty, decimals) : DEFAULT_AMOUNT;
    const minAmount = amount.mul(parseFixed(String(1 - slippage), 18)).div(WeiPerEther);

    const gasEstimation = await marketContract.estimateGas.depositAtMaturity(
      date.value,
      amount,
      minAmount,
      walletAddress,
    );

    setGasCost(gasPrice.mul(gasEstimation));
  }, [
    ETHRouterContract,
    approveEstimateGas,
    date,
    qty,
    isLoading,
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
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [walletBalance]);

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
    [walletBalance, translations, lang],
  );

  const deposit = useCallback(async () => {
    if (!accountData || !date || !qty || !ETHRouterContract || !marketContract || !walletAddress) return;

    let depositTx;
    try {
      const { decimals } = accountData[symbol];
      const amount = parseFixed(qty, decimals);
      const minAmount = amount.mul(parseFixed(String(1 - slippage), 18)).div(WeiPerEther);

      if (symbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date.value, minAmount, {
          value: amount,
        });

        depositTx = await ETHRouterContract.depositAtMaturity(date.value, minAmount, {
          value: amount,
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.depositAtMaturity(
          date.value,
          amount,
          minAmount,
          walletAddress,
        );

        depositTx = await marketContract.depositAtMaturity(date.value, amount, minAmount, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'depositAtMaturity' : 'depositAtMaturityRevert', {
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
      captureException(error);
      if (depositTx) return setTx({ status: 'error', hash: depositTx.hash });

      setErrorData({
        status: true,
        message: translations[lang].generalError,
      });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    ETHRouterContract,
    accountData,
    date,
    getAccountData,
    lang,
    marketContract,
    qty,
    slippage,
    symbol,
    translations,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (!needsAllowance) {
      void analytics.track('depositAtMaturityRequest', {
        amount: qty,
        maturity: date?.value,
        asset: symbol,
      });
      return deposit();
    }

    await approve();
    setErrorData(approveErrorData);
    setNeedsAllowance(await needsApproval());
  }, [approve, approveErrorData, date?.value, deposit, isLoading, needsAllowance, needsApproval, qty, symbol]);

  const updateAPR = useCallback(async () => {
    if (!accountData || !date || !previewerContract || !marketContract) return;

    const { decimals, usdPrice } = accountData[symbol];
    const initialAssets = qty ? parseFixed(qty, decimals) : getOneDollar(usdPrice, decimals);

    try {
      const { assets: finalAssets } = await previewerContract.previewDepositAtMaturity(
        marketContract.address,
        date.value,
        initialAssets,
      );

      const currentTimestamp = new Date().getTime() / 1000;
      const time = 31_536_000 / (parseInt(date?.value) - currentTimestamp);

      const rate = finalAssets.mul(WeiPerEther).div(initialAssets);
      const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;
      const slippageAPR = fixedAPR * (1 - numbers.slippage);

      setSlippage(slippageAPR);
      setFixedRate(fixedAPR);
    } catch (error) {
      setFixedRate(undefined);
    }
  }, [accountData, date, qty, marketContract, previewerContract, symbol]);

  useEffect(() => {
    void updateAPR();
  }, [updateAPR]);

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

  return (
    <>
      <ModalTitle title={translations[lang].fixedRateDeposit} />
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
        <ModalMaturityEditable text={translations[lang].maturityPool.toUpperCase()} />
        <ModalCell text={translations[lang].apr.toUpperCase()} value={toPercentage(fixedRate)} column />
      </Box>
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRowEditable
        text={translations[lang].minimumApr}
        value={toPercentage(slippage)}
        editable={editSlippage}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setSlippage(e.target.valueAsNumber);
        }}
        onClick={() => {
          setEditSlippage((prev) => !prev);
        }}
        line
      />

      <ModalStepper currentStep={needsAllowance ? 1 : 2} totalSteps={3} />

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
        {needsAllowance ? translations[lang].approve : translations[lang].deposit}
      </LoadingButton>
    </>
  );
};

export default DepositAtMaturity;
