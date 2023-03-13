import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import numbers from 'config/numbers.json';
import { MarketContext } from 'contexts/MarketContext';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useContext, useMemo, useState } from 'react';
import { OperationHook } from 'types/OperationHook';
import analytics from 'utils/analytics';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

type DepositAtMaturity = {
  deposit: () => void;
  updateAPR: () => void;
  optimalDepositAmount: BigNumber | undefined;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: number | undefined;
  gtMaxYield: boolean;
} & OperationHook;

export default (): DepositAtMaturity => {
  const { walletAddress } = useWeb3();
  const { date } = useContext(MarketContext);

  const {
    symbol,
    setErrorData,
    qty,
    setQty,
    setTx,
    requiresApproval,
    setRequiresApproval,
    isLoading: isLoadingOp,
    setIsLoading: setIsLoadingOp,
    marketContract,
    assetContract,
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
    setErrorButton,
  } = useOperationContext();
  const { marketAccount, refreshAccountData } = useAccountData(symbol);

  const handleOperationError = useHandleOperationError();

  const [fixedRate, setFixedRate] = useState<number | undefined>();
  const [gtMaxYield, setGtMaxYield] = useState<boolean>(false);

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
      if (
        !marketAccount ||
        !walletAddress ||
        !marketContract ||
        !ETHRouterContract ||
        !date ||
        !quantity ||
        (walletBalance && parseFloat(quantity) > parseFloat(walletBalance))
      )
        return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const amount = quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT;
        const minAmount = amount.mul(slippage).div(WeiPerEther);
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date, minAmount, {
          value: amount,
        });
        return gasPrice.mul(gasEstimation);
      }

      const amount = quantity ? parseFixed(quantity, marketAccount.decimals) : DEFAULT_AMOUNT;
      const minAmount = amount.mul(slippage).div(WeiPerEther);

      const gasEstimation = await marketContract.estimateGas.depositAtMaturity(date, amount, minAmount, walletAddress);

      return gasPrice.mul(gasEstimation);
    },
    [
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      walletBalance,
      requiresApproval,
      slippage,
      approveEstimateGas,
    ],
  );

  const isLoading = useMemo(() => approveIsLoading || isLoadingOp, [approveIsLoading, isLoadingOp]);

  const onMax = useCallback(() => {
    if (walletBalance) {
      setQty(walletBalance);
      setErrorData(undefined);
    }
  }, [setErrorData, setQty, walletBalance]);

  const { optimalDepositAmount, depositRate } = useMemo<{
    optimalDepositAmount?: BigNumber;
    depositRate?: BigNumber;
  }>(() => {
    if (!marketAccount) return { optimalDepositAmount: Zero, depositRate: Zero };

    const { fixedPools = [] } = marketAccount;
    const pool = fixedPools.find(({ maturity }) => maturity.toNumber() === date);
    return {
      optimalDepositAmount: pool?.optimalDeposit,
      depositRate: pool?.depositRate,
    };
  }, [marketAccount, date]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;
      const { decimals } = marketAccount;
      setQty(value);

      if (walletBalance && parseFloat(value) > parseFloat(walletBalance)) {
        setErrorButton('Insufficient balance');
        return;
      }
      setErrorButton(undefined);
      setErrorData(undefined);

      setGtMaxYield(!!optimalDepositAmount && parseFixed(value || '0', decimals).gt(optimalDepositAmount));
    },
    [setQty, walletBalance, setErrorButton, setErrorData, optimalDepositAmount, marketAccount],
  );

  const deposit = useCallback(async () => {
    if (!marketAccount || !date || !qty || !ETHRouterContract || !marketContract || !walletAddress) return;

    let depositTx;
    try {
      setIsLoadingOp(true);
      const amount = parseFixed(qty, marketAccount.decimals);
      const minAmount = amount.mul(slippage).div(WeiPerEther);

      if (marketAccount.assetSymbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(date, minAmount, {
          value: amount,
        });

        depositTx = await ETHRouterContract.depositAtMaturity(date, minAmount, {
          value: amount,
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.depositAtMaturity(
          date,
          amount,
          minAmount,
          walletAddress,
        );

        depositTx = await marketContract.depositAtMaturity(date, amount, minAmount, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: depositTx.hash });

      const { status, transactionHash } = await depositTx.wait();
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'depositAtMaturity' : 'depositAtMaturityRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        maturity: date,
        hash: transactionHash,
      });

      await refreshAccountData();
    } catch (error) {
      if (depositTx) setTx({ status: 'error', hash: depositTx.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    marketAccount,
    date,
    qty,
    ETHRouterContract,
    marketContract,
    walletAddress,
    slippage,
    setTx,
    refreshAccountData,
    setErrorData,
    handleOperationError,
    setIsLoadingOp,
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
      maturity: date,
      asset: symbol,
    });
    return deposit();
  }, [approve, date, deposit, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval, symbol]);

  const updateAPR = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract || !marketContract || !depositRate) {
      setFixedRate(undefined);
      return;
    }

    if (qty) {
      const initialAssets = parseFixed(qty, marketAccount.decimals);
      try {
        const { assets: finalAssets } = await previewerContract.previewDepositAtMaturity(
          marketContract.address,
          date,
          initialAssets,
        );

        const currentTimestamp = Date.now() / 1000;
        const time = 31_536_000 / (date - currentTimestamp);

        const rate = finalAssets.mul(WeiPerEther).div(initialAssets);
        const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;

        setFixedRate(fixedAPR);
      } catch (error) {
        setFixedRate(undefined);
      }
    } else {
      const fixedAPR = Number(depositRate.toBigInt()) / 1e18;
      setFixedRate(fixedAPR);
    }
  }, [marketAccount, date, previewerContract, marketContract, depositRate, qty]);

  return {
    isLoading,
    onMax,
    handleInputChange,
    handleSubmitAction,
    deposit,
    updateAPR,
    optimalDepositAmount,
    rawSlippage,
    setRawSlippage,
    fixedRate,
    gtMaxYield,
    previewGasCost,
    needsApproval,
  };
};
