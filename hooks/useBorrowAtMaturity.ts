import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import numbers from 'config/numbers.json';
import { MarketContext } from 'contexts/MarketContext';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useContext, useMemo, useState } from 'react';
import { OperationHook } from 'types/OperationHook';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import useHealthFactor from './useHealthFactor';
import useAnalytics from './useAnalytics';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);

type BorrowAtMaturity = {
  borrow: () => void;
  updateAPR: () => void;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: BigNumber | undefined;
  hasCollateral: boolean;
  safeMaximumBorrow: string;
} & OperationHook;

export default (): BorrowAtMaturity => {
  const { track } = useAnalytics();
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
    ETHRouterContract,
    rawSlippage,
    setRawSlippage,
    slippage,
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const { accountData, marketAccount, refreshAccountData } = useAccountData(symbol);

  const [fixedRate, setFixedRate] = useState<BigNumber | undefined>();

  const healthFactor = useHealthFactor();
  const minBorrowRate = useMemo<BigNumber | undefined>(() => {
    if (!marketAccount) return;

    const { fixedPools = [] } = marketAccount;
    const pool = fixedPools.find(({ maturity }) => maturity.toNumber() === date);
    return pool?.minBorrowRate;
  }, [marketAccount, date]);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('borrowAtMaturity', marketContract, ETHRouterContract?.address);

  const poolLiquidity = usePoolLiquidity(symbol);

  const hasCollateral = useMemo(() => {
    if (!accountData || !marketAccount) return false;

    return marketAccount.floatingDepositAssets.gt(Zero) || accountData.some((aMarket) => aMarket.isCollateral);
  }, [accountData, marketAccount]);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!marketAccount || !walletAddress || !marketContract || !ETHRouterContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (marketAccount.assetSymbol === 'WETH') {
        const amount = quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT;
        const maxAmount = amount.mul(slippage).div(WeiPerEther);

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date, amount, maxAmount);

        return gasPrice.mul(gasEstimation);
      }

      const amount = quantity ? parseFixed(quantity, marketAccount.decimals) : DEFAULT_AMOUNT;
      const maxAmount = amount.mul(slippage).div(WeiPerEther);
      const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(
        date,
        amount,
        maxAmount,
        walletAddress,
        walletAddress,
      );
      return gasPrice.mul(gasEstimation);
    },
    [
      marketAccount,
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      requiresApproval,
      slippage,
      approveEstimateGas,
    ],
  );

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const safeMaximumBorrow = useMemo((): string => {
    if (!marketAccount || !healthFactor) return '';

    const { usdPrice, adjustFactor, floatingDepositAssets, isCollateral, decimals } = marketAccount;

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(floatingDepositAssets, decimals)) > 0;

    if (!isCollateral && hasDepositedToFloatingPool) {
      col = col.add(floatingDepositAssets.mul(adjustFactor).div(WeiPerEther));
    }

    const { debt } = healthFactor;

    return Math.max(
      0,
      Number(
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
      ),
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
          message: 'There is not enough liquidity in this pool',
        });
      }

      const maxBorrowAssets = getBeforeBorrowLimit(marketAccount, 'borrow');

      if (
        maxBorrowAssets.lt(
          parseFixed(value || '0', decimals)
            .mul(usdPrice)
            .div(WeiPerEther),
        )
      ) {
        return setErrorData({
          status: true,
          message: `You can't borrow more than your borrow limit`,
        });
      }
      setErrorData(undefined);
    },
    [marketAccount, setQty, poolLiquidity, setErrorData],
  );

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && Number(formatFixed(slippage, 18)) < Number(fixedRate) / 1e18) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: 'The transaction failed, please check your Maximum Deposit Rate',
      });
    }

    if (!marketAccount || !date || !qty || !walletAddress) return;

    const amount = parseFixed(qty, marketAccount.decimals);
    const maxAmount = amount.mul(slippage).div(WeiPerEther);

    let borrowTx;
    try {
      if (marketAccount.assetSymbol === 'WETH') {
        if (!ETHRouterContract) throw new Error('ETHRouterContract is undefined');

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date, amount, maxAmount);

        borrowTx = await ETHRouterContract.borrowAtMaturity(date, amount, maxAmount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        if (!marketContract) return;

        const gasEstimation = await marketContract.estimateGas.borrowAtMaturity(
          date,
          amount,
          maxAmount,
          walletAddress,
          walletAddress,
        );

        borrowTx = await marketContract.borrowAtMaturity(date, amount, maxAmount, walletAddress, walletAddress, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      }

      setTx({ status: 'processing', hash: borrowTx?.hash });

      const { status, transactionHash } = await borrowTx.wait();
      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void track(status ? 'borrowAtMaturity' : 'borrowAtMaturityRevert', {
        amount: qty,
        asset: marketAccount.assetSymbol,
        maturity: date,
        hash: transactionHash,
      });

      await refreshAccountData();
    } catch (error) {
      if (borrowTx?.hash) setTx({ status: 'error', hash: borrowTx.hash });

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
    marketAccount,
    slippage,
    date,
    qty,
    walletAddress,
    setErrorData,
    setTx,
    track,
    refreshAccountData,
    ETHRouterContract,
    marketContract,
    handleOperationError,
  ]);

  const updateAPR = useCallback(async () => {
    if (!marketAccount || !date || !previewerContract || !marketContract || !minBorrowRate) {
      setFixedRate(undefined);
      return;
    }

    if (qty) {
      const initialAssets = parseFixed(qty, marketAccount.decimals);
      try {
        const { assets: finalAssets } = await previewerContract.previewBorrowAtMaturity(
          marketContract.address,
          date,
          initialAssets,
        );
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const rate = finalAssets.mul(WeiPerEther).div(initialAssets);
        const fixedAPR = rate.sub(WeiPerEther).mul(31_536_000).div(BigNumber.from(date).sub(currentTimestamp));

        setFixedRate(fixedAPR);
      } catch (error) {
        setFixedRate(undefined);
      }
    } else {
      setFixedRate(minBorrowRate);
    }
  }, [marketAccount, date, previewerContract, marketContract, minBorrowRate, qty]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void track('borrowAtMaturityRequest', {
      amount: qty,
      maturity: date,
      asset: symbol,
    });

    return borrow();
  }, [isLoading, requiresApproval, track, qty, date, symbol, borrow, approve, setRequiresApproval, needsApproval]);

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
