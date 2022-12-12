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
import getOneDollar from 'utils/getOneDollar';

import numbers from 'config/numbers.json';

import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import keys from './translations.json';
import useBalance from 'hooks/useBalance';
import useMarket from 'hooks/useMarket';
import useApprove from 'hooks/useApprove';
import useETHRouter from 'hooks/useETHRouter';
import usePreviewer from 'hooks/usePreviewer';
import useERC20 from 'hooks/useERC20';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { toPercentage } from 'utils/utils';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

const DepositAtMaturity: FC = () => {
  const { walletAddress } = useWeb3();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

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

  const [slippage, setSlippage] = useState<number>(0);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [fixedRate, setFixedRate] = useState<number | undefined>(undefined);

  const ETHRouterContract = useETHRouter();
  const marketContract = useMarket(market?.value);

  const assetContract = useERC20();

  const walletBalance = useBalance(symbol, assetContract);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('depositAtMaturity', assetContract, marketContract?.address);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !date) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (symbol === 'WETH') {
        const amount = quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT;
        const minAmount = amount.mul(parseFixed(String(1 - slippage), 18)).div(WeiPerEther);
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date.value, minAmount, {
          value: amount,
        });
        return gasPrice.mul(gasEstimation);
      }

      const decimals = await marketContract.decimals();
      const amount = quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT;
      const minAmount = amount.mul(parseFixed(String(1 - slippage), 18)).div(WeiPerEther);

      const gasEstimation = await marketContract.estimateGas.depositAtMaturity(
        date.value,
        amount,
        minAmount,
        walletAddress,
      );

      return gasPrice.mul(gasEstimation);
    },
    [walletAddress, marketContract, ETHRouterContract, date, requiresApproval, symbol, slippage, approveEstimateGas],
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
  }, [setErrorData, setQty, walletBalance]);

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

      void getAccountData();
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
    setErrorData,
    setIsLoadingOp,
    setTx,
    slippage,
    symbol,
    translations,
    walletAddress,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('depositAtMaturityRequest', {
      amount: qty,
      maturity: date?.value,
      asset: symbol,
    });
    return deposit();
  }, [approve, date?.value, deposit, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol]);

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

      <ModalStepper currentStep={requiresApproval ? 1 : 2} totalSteps={3} />

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
        {requiresApproval ? translations[lang].approve : translations[lang].deposit}
      </LoadingButton>
    </>
  );
};

export default React.memo(DepositAtMaturity);
