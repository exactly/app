import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';

import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import { toPercentage } from 'utils/utils';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';
import AccountDataContext from 'contexts/AccountDataContext';

import useBalance from 'hooks/useBalance';
import usePoolLiquidity from 'hooks/usePoolLiquidity';
import useApprove from 'hooks/useApprove';
import usePreviewer from 'hooks/usePreviewer';

import keys from './translations.json';

import numbers from 'config/numbers.json';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import getHealthFactorData from 'utils/getHealthFactorData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoFixedAPR from 'components/OperationsModal/Info/ModalInfoFixedAPR';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import useAccountData from 'hooks/useAccountData';
import handleOperationError from 'utils/handleOperationError';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (numbers.slippage * 100).toFixed(2);

const BorrowAtMaturity: FC = () => {
  const { operation } = useModalStatus();
  const { walletAddress } = useWeb3();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { date } = useContext(MarketContext);

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
    marketContract,
    assetContract,
    ETHRouterContract,
  } = useOperationContext();

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
  }, [accountData, lang, setErrorData, symbol, translations]);

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

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

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
    [accountData, symbol, setQty, poolLiquidity, decimals, setErrorData, translations, lang],
  );

  const borrow = useCallback(async () => {
    setIsLoadingOp(true);

    if (fixedRate && Number(formatFixed(slippage, 18)) < fixedRate) {
      setIsLoadingOp(false);

      return setErrorData({
        status: true,
        message: translations[lang].notEnoughSlippage,
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
    ETHRouterContract,
    accountData,
    date,
    fixedRate,
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
    decimals,
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

  // update APR
  useEffect(() => {
    void updateAPR();
  }, [updateAPR]);

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

  if (tx) return <ModalGif tx={tx} tryAgain={borrow} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={onMax}
              onChange={handleInputChange}
              label="Wallet balance"
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoFixedAPR fixedAPR={toPercentage(fixedRate)} />
            </ModalBoxCell>
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="borrowAtMaturity" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} variant="row" />
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={2}>
          <ModalAlert variant="error" message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={4}>
        <ModalSubmit
          label="Borrow"
          symbol={symbol === 'WETH' && accountData ? accountData[symbol].symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || errorData?.status}
          requiresApproval={requiresApproval}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(BorrowAtMaturity);
