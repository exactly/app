import { useCallback, useMemo, useState } from 'react';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useBalance from 'hooks/useBalance';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import { OperationHook } from 'types/OperationHook';
import { WEI_PER_ETHER } from 'utils/const';
import { CustomError } from 'types/Error';
import useEstimateGas from './useEstimateGas';
import { formatUnits, parseUnits } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import dayjs from 'dayjs';
import { gasLimit } from 'utils/gas';
import { track } from 'utils/segment';

type DepositAtMaturity = {
  deposit: () => void;
  updateAPR: () => void;
  optimalDepositAmount: bigint | undefined;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: bigint | undefined;
  gtMaxYield: boolean;
} & OperationHook;

export default (): DepositAtMaturity => {
  const { t } = useTranslation();
  const { walletAddress, opts } = useWeb3();

  const {
    symbol,
    setErrorData,
    qty,
    setQty,
    setTx,
    date,
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

  const { marketAccount } = useAccountData(symbol);

  const handleOperationError = useHandleOperationError();

  const [fixedRate, setFixedRate] = useState<bigint | undefined>();
  const [gtMaxYield, setGtMaxYield] = useState<boolean>(false);

  const walletBalance = useBalance(symbol, assetContract?.address);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove({ operation: 'depositAtMaturity', contract: assetContract, spender: marketAccount?.market });

  const estimate = useEstimateGas();

  const previewGasCost = useCallback(
    async (quantity: string): Promise<bigint | undefined> => {
      if (
        !marketAccount ||
        !walletAddress ||
        !marketContract ||
        !ETHRouterContract ||
        !date ||
        !quantity ||
        (walletBalance && parseFloat(quantity) > parseFloat(walletBalance)) ||
        !opts
      )
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = parseUnits(quantity, marketAccount.decimals);
      const minAmount = (amount * slippage) / WEI_PER_ETHER;

      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.depositAtMaturity([date, minAmount], {
          ...opts,
          value: amount,
        });
        const gasCost = await estimate(sim.request);
        if (amount + (gasCost ?? 0n) >= parseUnits(walletBalance || '0', 18)) {
          throw new CustomError(t('Reserve ETH for gas fees.'), 'warning');
        }
        return gasCost;
      }

      const sim = await marketContract.simulate.depositAtMaturity([date, amount, minAmount, walletAddress], opts);
      return estimate(sim.request);
    },
    [
      opts,
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      walletBalance,
      needsApproval,
      slippage,
      estimate,
      approveEstimateGas,
      t,
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
    optimalDepositAmount?: bigint;
    depositRate?: bigint;
  }>(() => {
    if (!marketAccount) return { optimalDepositAmount: 0n, depositRate: 0n };

    const { fixedPools = [] } = marketAccount;
    const pool = fixedPools.find(({ maturity }) => maturity === date);
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
        setErrorButton(t('Insufficient balance'));
        return;
      }
      setErrorButton(undefined);
      setErrorData(undefined);

      setGtMaxYield(!!optimalDepositAmount && parseUnits(value || '0', decimals) > optimalDepositAmount);
    },
    [setQty, walletBalance, setErrorButton, setErrorData, optimalDepositAmount, marketAccount, t],
  );

  const deposit = useCallback(async () => {
    if (!marketAccount || !date || !qty || !ETHRouterContract || !marketContract || !walletAddress || !opts) return;

    let hash;
    setIsLoadingOp(true);
    try {
      const amount = parseUnits(qty, marketAccount.decimals);
      const minAmount = (amount * slippage) / WEI_PER_ETHER;
      if (marketAccount.assetSymbol === 'WETH') {
        const args = [date, minAmount] as const;
        const gasEstimation = await ETHRouterContract.estimateGas.depositAtMaturity(args, {
          ...opts,
          value: amount,
        });
        hash = await ETHRouterContract.write.depositAtMaturity(args, {
          ...opts,
          value: amount,
          gasLimit: gasLimit(gasEstimation),
        });
        track('TX Signed', {
          contractName: 'ETHRouter',
          method: 'depositAtMaturity',
          hash,
          symbol,
          amount: qty,
          usdAmount: formatUnits((amount * marketAccount.usdPrice) / WEI_PER_ETHER, marketAccount.decimals),
        });
      } else {
        const args = [date, amount, minAmount, walletAddress] as const;
        const gasEstimation = await marketContract.estimateGas.depositAtMaturity(args, opts);
        hash = await marketContract.write.depositAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
        track('TX Signed', {
          contractName: 'Market',
          method: 'depositAtMaturity',
          symbol,
          amount: qty,
          usdAmount: formatUnits((amount * marketAccount.usdPrice) / WEI_PER_ETHER, marketAccount.decimals),
          hash,
        });
      }

      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });
      track('TX Completed', {
        symbol,
        amount: qty,
        usdAmount: formatUnits((amount * marketAccount.usdPrice) / WEI_PER_ETHER, marketAccount.decimals),
        status,
        hash: transactionHash,
      });

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });
    } catch (error) {
      if (hash) setTx({ status: 'error', hash });
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
    opts,
    setIsLoadingOp,
    slippage,
    setTx,
    setErrorData,
    handleOperationError,
    symbol,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    return deposit();
  }, [approve, deposit, isLoading, needsApproval, qty, requiresApproval, setRequiresApproval]);

  const updateAPR = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract || !depositRate) {
      setFixedRate(undefined);
      return;
    }

    if (qty) {
      const initialAssets = parseUnits(qty, marketAccount.decimals);
      try {
        const { assets: finalAssets } = await previewerContract.read.previewDepositAtMaturity([
          marketAccount.market,
          date,
          initialAssets,
        ]);
        const currentTimestamp = BigInt(dayjs().unix());
        const rate = (finalAssets * WEI_PER_ETHER) / initialAssets;
        const fixedAPR = ((rate - WEI_PER_ETHER) * 31_536_000n) / (date - currentTimestamp);

        setFixedRate(fixedAPR);
      } catch (error) {
        setFixedRate(undefined);
      }
    } else {
      setFixedRate(depositRate);
    }
  }, [marketAccount, date, previewerContract, depositRate, qty]);

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
