import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import numbers from 'config/numbers.json';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import { useOperationContext } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';
import useApprove from 'hooks/useApprove';
import useHandleOperationError from 'hooks/useHandleOperationError';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { useCallback, useContext, useMemo, useState } from 'react';
import { HealthFactor } from 'types/HealthFactor';
import { OperationHook } from 'types/OperationHook';
import analytics from 'utils/analytics';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import getHealthFactorData from 'utils/getHealthFactorData';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

type BorrowAtMaturity = {
  borrow: () => void;
  updateAPR: () => void;
  rawSlippage: string;
  setRawSlippage: (value: string) => void;
  fixedRate: number | undefined;
  hasCollateral: boolean;
} & OperationHook;

export default (): BorrowAtMaturity => {
  const { walletAddress } = useWeb3();
  const { accountData, getAccountData } = useContext(AccountDataContext);
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
  } = useOperationContext();

  const handleOperationError = useHandleOperationError();

  const { decimals = 18 } = useAccountData(symbol);

  const [fixedRate, setFixedRate] = useState<number | undefined>();
  const [rawSlippage, setRawSlippage] = useState(DEFAULT_SLIPPAGE);

  const slippage = useMemo(() => parseFixed(String(1 + Number(rawSlippage) / 100), 18), [rawSlippage]);

  const healthFactor = useMemo<HealthFactor | undefined>(
    () => (accountData ? getHealthFactorData(accountData) : undefined),
    [accountData],
  );

  const minBorrowRate = useMemo<BigNumber | undefined>(() => {
    if (!accountData) return;

    const { fixedPools = [] } = accountData[symbol];
    const pool = fixedPools.find(({ maturity }) => maturity.toNumber() === date);
    return pool?.minBorrowRate;
  }, [accountData, date, symbol]);

  const previewerContract = usePreviewer();

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('borrowAtMaturity', marketContract, ETHRouterContract?.address);

  const poolLiquidity = usePoolLiquidity(symbol);

  const hasCollateral = useMemo(() => {
    if (!accountData) return false;

    return (
      // isCollateral
      accountData[symbol].floatingDepositAssets.gt(Zero) ||
      // hasDepositedToFloatingPool
      Object.keys(accountData).some((aMarket) => accountData[aMarket].isCollateral)
    );
  }, [accountData, symbol]);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      if (symbol === 'WETH') {
        const amount = quantity ? parseFixed(quantity, 18) : DEFAULT_AMOUNT;
        const maxAmount = amount.mul(slippage).div(WeiPerEther);

        const gasEstimation = await ETHRouterContract.estimateGas.borrowAtMaturity(date, amount, maxAmount);

        return gasPrice.mul(gasEstimation);
      }

      const amount = quantity ? parseFixed(quantity, decimals) : DEFAULT_AMOUNT;
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
      walletAddress,
      marketContract,
      ETHRouterContract,
      date,
      requiresApproval,
      symbol,
      slippage,
      approveEstimateGas,
      decimals,
    ],
  );

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

  const onMax = useCallback(() => {
    if (!accountData || !healthFactor) return;

    const { usdPrice, adjustFactor, floatingDepositAssets, isCollateral } = accountData[symbol];

    let col = healthFactor.collateral;
    const hf = parseFixed('1.05', 18);

    const hasDepositedToFloatingPool = Number(formatFixed(floatingDepositAssets, decimals)) > 0;

    if (!isCollateral && hasDepositedToFloatingPool) {
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
  }, [accountData, decimals, healthFactor, setErrorData, setQty, symbol]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!accountData) return;
      const { usdPrice } = accountData[symbol];

      setQty(value);

      if (poolLiquidity && poolLiquidity < parseFloat(value)) {
        return setErrorData({
          status: true,
          message: 'There is not enough liquidity in this pool',
        });
      }

      const maxBorrowAssets = getBeforeBorrowLimit(accountData[symbol], 'borrow');

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
    [accountData, symbol, setQty, poolLiquidity, decimals, setErrorData],
  );

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && Number(formatFixed(slippage, 18)) < fixedRate) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: 'The transaction failed, please check your Maximum Deposit Rate',
      });
    }

    if (!accountData || !date || !qty || !walletAddress) return;

    const amount = parseFixed(qty, decimals);
    const maxAmount = amount.mul(slippage).div(WeiPerEther);

    let borrowTx;
    try {
      if (symbol === 'WETH') {
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

      void analytics.track(status ? 'borrowAtMaturity' : 'borrowAtMaturityRevert', {
        amount: qty,
        asset: symbol,
        maturity: date,
        hash: transactionHash,
      });

      void getAccountData();
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
    slippage,
    accountData,
    date,
    qty,
    walletAddress,
    decimals,
    setErrorData,
    symbol,
    setTx,
    getAccountData,
    ETHRouterContract,
    marketContract,
    handleOperationError,
  ]);

  const updateAPR = useCallback(async () => {
    if (!accountData || !date || !previewerContract || !marketContract || !minBorrowRate) return;

    if (qty) {
      const initialAssets = parseFixed(qty, decimals);
      try {
        const { assets: finalAssets } = await previewerContract.previewBorrowAtMaturity(
          marketContract.address,
          date,
          initialAssets,
        );

        const currentTimestamp = Date.now() / 1000;
        const time = 31_536_000 / (Number(date) - currentTimestamp);

        const rate = finalAssets.mul(WeiPerEther).div(initialAssets);

        const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;
        const slippageAPR = fixedAPR * (1 + numbers.slippage);

        setRawSlippage((slippageAPR * 100).toFixed(2));
        setFixedRate(fixedAPR);
      } catch (error) {
        setFixedRate(undefined);
      }
    } else {
      const fixedAPR = Number(minBorrowRate.toBigInt()) / 1e18;
      const slippageAPR = fixedAPR * (1 - numbers.slippage);
      setRawSlippage((slippageAPR * 100).toFixed(2));
      setFixedRate(fixedAPR);
    }
  }, [accountData, date, previewerContract, marketContract, minBorrowRate, qty, decimals]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('borrowAtMaturityRequest', {
      amount: qty,
      maturity: date,
      asset: symbol,
    });

    return borrow();
  }, [isLoading, requiresApproval, qty, date, symbol, borrow, approve, setRequiresApproval, needsApproval]);

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
  };
};
