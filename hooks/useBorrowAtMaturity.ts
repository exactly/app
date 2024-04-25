import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { OperationHook } from 'types/OperationHook';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import useEstimateGas from './useEstimateGas';
import { formatUnits, parseUnits } from 'viem';
import waitForTransaction from 'utils/waitForTransaction';
import dayjs from 'dayjs';
import { gasLimit } from 'utils/gas';
import { track } from 'utils/mixpanel';

type BorrowAtMaturity = {
  borrow: () => void;
  updateAPR: () => void;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: bigint | undefined;
  hasCollateral: boolean;
  safeMaximumBorrow: string;
} & OperationHook;

export default (): BorrowAtMaturity => {
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
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
    receiver,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const { accountData, marketAccount } = useAccountData(symbol);

  const [fixedRate, setFixedRate] = useState<bigint | undefined>();
  const [fixedFee, setFixedFee] = useState<bigint | undefined>();

  const healthFactor = useHealthFactor();
  const minBorrowRate = useMemo<bigint | undefined>(() => {
    if (!marketAccount) return;

    const { fixedPools = [] } = marketAccount;
    const pool = fixedPools.find(({ maturity }) => maturity === date);
    return pool?.minBorrowRate;
  }, [marketAccount, date]);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove({ operation: 'borrowAtMaturity', contract: marketContract, spender: ETHRouterContract?.address });

  const poolLiquidity = usePoolLiquidity(symbol);

  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return marketAccount.floatingDepositAssets > 0n || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);

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
        !opts ||
        !fixedFee
      )
        return;

      if (await needsApproval(quantity)) {
        return approveEstimateGas();
      }

      const amount = parseUnits(quantity, marketAccount.decimals);
      const maxAmount = ((amount + fixedFee) * slippage) / WAD;

      if (marketAccount.assetSymbol === 'WETH') {
        const sim = await ETHRouterContract.simulate.borrowAtMaturity([date, amount, maxAmount], opts);
        return estimate(sim.request);
      }

      const sim = await marketContract.simulate.borrowAtMaturity(
        [date, amount, maxAmount, walletAddress, walletAddress],
        opts,
      );
      return estimate(sim.request);
    },
    [
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      opts,
      needsApproval,
      fixedFee,
      slippage,
      estimate,
      approveEstimateGas,
    ],
  );

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { usdPrice, adjustFactor, floatingDepositAssets, isCollateral, decimals } = marketAccount;

    let col = healthFactor.collateral;
    const hf = parseUnits('1.05', 18);

    const hasDepositedToFloatingPool = floatingDepositAssets > 0n;

    if (!isCollateral && hasDepositedToFloatingPool) {
      col = col + (floatingDepositAssets * adjustFactor) / WAD;
    }

    const { debt } = healthFactor;

    return Math.max(
      0,
      Number(formatUnits(((((((col - (hf * debt) / WAD) * WAD) / hf) * WAD) / usdPrice) * adjustFactor) / WAD, 18)),
    ).toFixed(decimals);
  }, [marketAccount, healthFactor]);

  const onMax = useCallback(() => {
    setQty(safeMaximumBorrow);
    setErrorData(undefined);
  }, [safeMaximumBorrow, setErrorData, setQty]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!marketAccount) return;
      const { usdPrice, decimals } = marketAccount;

      setQty(value);

      if (poolLiquidity && poolLiquidity < parseFloat(value)) {
        return setErrorData({
          status: true,
          message: t('There is not enough liquidity in this pool'),
        });
      }

      const borrowLimit = getBeforeBorrowLimit(marketAccount, 'borrow');

      if (borrowLimit < (parseUnits(value || '0', decimals) * usdPrice) / WAD) {
        return setErrorData({
          status: true,
          message: t("You can't borrow more than your borrow limit"),
        });
      }
      setErrorData(undefined);
    },
    [marketAccount, setQty, poolLiquidity, setErrorData, t],
  );

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && slippage < fixedRate) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: t('The transaction failed, please check your Maximum Deposit Rate'),
      });
    }

    if (!marketAccount || !date || !qty || !walletAddress || !opts || !fixedFee) return;

    const amount = parseUnits(qty, marketAccount.decimals);
    const maxAmount = ((amount + fixedFee) * slippage) / WAD;

    let hash;
    try {
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) return;

        const args = [date, amount, maxAmount] as const;

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(args, opts);

        hash = await ETHRouterContract.write.borrowAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
        track('TX Signed', {
          contractName: 'ETHRouter',
          method: 'borrowAtMaturity',
          symbol,
          amount: qty,
          usdAmount: formatUnits((amount * marketAccount.usdPrice) / WAD, marketAccount.decimals),
          hash,
        });
      } else {
        if (!marketContract) return;

        const borrower = walletAddress;
        const args = [date, amount, maxAmount, receiver || walletAddress, borrower] as const;
        const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(args, opts);

        hash = await marketContract.write.borrowAtMaturity(args, {
          ...opts,
          gasLimit: gasLimit(gasEstimation),
        });
        track('TX Signed', {
          contractName: 'Market',
          method: 'borrowAtMaturity',
          symbol,
          amount: qty,
          usdAmount: formatUnits((amount * marketAccount.usdPrice) / WAD, marketAccount.decimals),
          hash,
        });
      }

      setTx({ status: 'processing', hash });

      const { status, transactionHash } = await waitForTransaction({ hash });
      track('TX Completed', {
        symbol,
        amount: qty,
        usdAmount: formatUnits((amount * marketAccount.usdPrice) / WAD, marketAccount.decimals),
        status,
        hash: transactionHash,
      });
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });
    } catch (error) {
      if (hash) setTx({ status: 'error', hash });

      setErrorData({
        status: true,
        message: handleOperationError(error),
      });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    setIsLoadingOp,
    fixedRate,
    slippage,
    marketAccount,
    date,
    qty,
    walletAddress,
    opts,
    fixedFee,
    setErrorData,
    t,
    setTx,
    symbol,
    ETHRouterContract,
    marketContract,
    receiver,
    handleOperationError,
  ]);

  const updateAPR = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract || !minBorrowRate) {
      setFixedRate(undefined);
      return;
    }

    if (qty) {
      const initialAssets = parseUnits(qty, marketAccount.decimals);
      try {
        const { assets: finalAssets } = await previewerContract.read.previewBorrowAtMaturity([
          marketAccount.market,
          date,
          initialAssets,
        ]);
        const currentTimestamp = BigInt(dayjs().unix());
        const rate = (finalAssets * WAD) / initialAssets;
        const fixedAPR = ((rate - WAD) * 31_536_000n) / (date - currentTimestamp);

        setFixedRate(fixedAPR);
        setFixedFee(finalAssets - initialAssets);
      } catch (error) {
        setFixedRate(undefined);
        setFixedFee(undefined);
      }
    } else {
      setFixedRate(minBorrowRate);
    }
  }, [marketAccount, date, previewerContract, minBorrowRate, qty]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    return borrow();
  }, [isLoading, requiresApproval, qty, borrow, approve, setRequiresApproval, needsApproval]);

  return {
    isLoading,
    onMax,
    handleInputChange,
    handleSubmitAction,
    borrow,
    updateAPR,
    rawSlippage,
    setRawSlippage,
    fixedRate,
    hasCollateral,
    previewGasCost,
    needsApproval,
    safeMaximumBorrow,
  };
};
