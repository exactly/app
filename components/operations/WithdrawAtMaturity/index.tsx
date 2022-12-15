import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AddressZero, WeiPerEther, Zero } from '@ethersproject/constants';
import LoadingButton from '@mui/lab/LoadingButton';

import ModalAsset from 'components/common/modal/ModalAsset';
import ModalError from 'components/common/modal/ModalError';
import ModalGif from 'components/common/modal/ModalGif';
import ModalInput from 'components/common/modal/ModalInput';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalRow from 'components/common/modal/ModalRow';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';

import { LangKeys } from 'types/Lang';

import formatNumber from 'utils/formatNumber';

import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import LangContext from 'contexts/LangContext';
import { useWeb3 } from 'hooks/useWeb3';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import useApprove from 'hooks/useApprove';
import handleOperationError from 'utils/handleOperationError';
import usePreviewer from 'hooks/usePreviewer';
import analytics from 'utils/analytics';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import useAccountData from 'hooks/useAccountData';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (100 * numbers.slippage).toFixed(2);

const WithdrawAtMaturity: FC = () => {
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

  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [editSlippage, setEditSlippage] = useState(false);

  const [minAmountToWithdraw, setMinAmountToWithdraw] = useState(Zero);
  const [amountToWithdraw, setAmountToWithdraw] = useState(Zero);

  const marketContract = useMarket(market?.value);
  const ETHRouterContract = useETHRouter();

  const previewerContract = usePreviewer();

  const rawSlippage = useMemo(() => parseFixed(String(1 - Number(slippage) / 100), 18), [slippage]);
  const { decimals = 18 } = useAccountData(symbol);

  const isEarlyWithdraw = useMemo(() => {
    if (!date) return false;
    return Date.now() / 1000 < parseInt(date.value);
  }, [date]);

  const positionAssets = useMemo(() => {
    if (!accountData || !date) return '0';

    const pool = accountData[symbol].fixedDepositPositions.find(
      ({ maturity }) => String(maturity.toNumber()) === date.value,
    );
    return pool ? pool.position.principal.add(pool.position.fee) : Zero;
  }, [date, accountData, symbol]);

  const amountAtFinish = useMemo(() => formatFixed(positionAssets, decimals), [decimals, positionAssets]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    needsApproval,
  } = useApprove('withdrawAtMaturity', marketContract, ETHRouterContract?.address);

  const previewWithdrawAtMaturity = useCallback(async () => {
    if (!date || !marketContract || !previewerContract) return;

    if (!qty) {
      setMinAmountToWithdraw(Zero);
      return;
    }

    const parsedQtyValue = parseFixed(qty, decimals);
    const amount = await previewerContract.previewWithdrawAtMaturity(
      marketContract.address,
      date.value,
      parsedQtyValue,
      walletAddress ?? AddressZero,
    );

    setAmountToWithdraw(amount);
    setMinAmountToWithdraw(isEarlyWithdraw ? amount.mul(rawSlippage).div(WeiPerEther) : amount);
  }, [decimals, date, qty, marketContract, previewerContract, rawSlippage, isEarlyWithdraw, walletAddress]);

  useEffect(() => {
    if (errorData?.status) return;
    previewWithdrawAtMaturity().catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [previewWithdrawAtMaturity, errorData?.status, setErrorData]);

  const previewGasCost = useCallback(
    async (quantity: string): Promise<BigNumber | undefined> => {
      if (!walletAddress || !marketContract || !ETHRouterContract || !date || !quantity) return;

      const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
      if (!gasPrice) return;

      if (requiresApproval) {
        // only WETH needs allowance -> estimates directly with the ETH router
        const gasEstimation = await approveEstimateGas();
        return gasEstimation?.mul(gasPrice);
      }

      const amount = amountToWithdraw.isZero() ? DEFAULT_AMOUNT : amountToWithdraw;

      if (symbol === 'WETH') {
        const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(
          date.value,
          amount,
          minAmountToWithdraw,
        );
        return gasPrice.mul(gasEstimation);
      }

      const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
        date.value,
        amount,
        minAmountToWithdraw,
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
      amountToWithdraw,
      symbol,
      minAmountToWithdraw,
      approveEstimateGas,
    ],
  );

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  const isLoading = useMemo(
    () => isLoadingOp || approveIsLoading || previewIsLoading,
    [isLoadingOp, approveIsLoading, previewIsLoading],
  );

  const onMax = useCallback(() => setQty(formatFixed(positionAssets, decimals)), [decimals, positionAssets, setQty]);

  const handleInputChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      setQty(value);

      const parsedValue = parseFixed(value || '0', decimals);

      if (parsedValue.isZero()) {
        return setErrorData({ status: true, message: 'Cannot withdraw 0' });
      }

      if (parsedValue.gt(positionAssets)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
        });
      }

      setErrorData(undefined);
    },
    [setQty, decimals, positionAssets, setErrorData, translations, lang],
  );

  const withdraw = useCallback(async () => {
    if (!date || !marketContract || !walletAddress || !qty) return;

    let withdrawTx;
    try {
      setIsLoadingOp(true);

      if (symbol === 'WETH') {
        if (!ETHRouterContract) return;

        const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(
          date.value,
          parseFixed(qty, 18),
          minAmountToWithdraw,
        );
        withdrawTx = await ETHRouterContract.withdrawAtMaturity(date.value, parseFixed(qty, 18), minAmountToWithdraw, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
          date.value,
          parseFixed(qty, decimals),
          minAmountToWithdraw,
          walletAddress,
          walletAddress,
        );

        withdrawTx = await marketContract.withdrawAtMaturity(
          date.value,
          parseFixed(qty, decimals),
          minAmountToWithdraw,
          walletAddress,
          walletAddress,
          {
            gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
          },
        );
      }

      setTx({ status: 'processing', hash: withdrawTx?.hash });

      const { status, transactionHash } = await withdrawTx.wait();

      setTx({ status: status ? 'success' : 'error', hash: transactionHash });

      void analytics.track(status ? 'withdrawAtMaturity' : 'withdrawAtMaturityRevert', {
        amount: qty,
        asset: symbol,
        maturity: date.value,
        hash: transactionHash,
      });

      void getAccountData();
    } catch (error) {
      if (withdrawTx) setTx({ status: 'error', hash: withdrawTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    date,
    marketContract,
    walletAddress,
    qty,
    setIsLoadingOp,
    symbol,
    setTx,
    getAccountData,
    ETHRouterContract,
    minAmountToWithdraw,
    decimals,
    setErrorData,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (requiresApproval) {
      await approve();
      setRequiresApproval(await needsApproval(qty));
      return;
    }

    void analytics.track('withdrawAtMaturityRequest', {
      amount: qty,
      maturity: date?.value,
      asset: symbol,
    });

    return withdraw();
  }, [isLoading, requiresApproval, qty, date?.value, symbol, withdraw, approve, setRequiresApproval, needsApproval]);

  if (tx) return <ModalGif tx={tx} tryAgain={withdraw} />;

  return (
    <>
      <ModalTitle title={isEarlyWithdraw ? translations[lang].earlyWithdraw : translations[lang].withdraw} />
      <ModalAsset
        asset={symbol}
        assetTitle={translations[lang].action.toUpperCase()}
        amount={amountAtFinish}
        amountTitle={translations[lang].depositedAmount.toUpperCase()}
      />
      <ModalMaturityEditable text={translations[lang].maturityPool} line />
      <ModalInput
        onMax={onMax}
        value={qty}
        onChange={handleInputChange}
        symbol={symbol}
        error={errorData?.component === 'input'}
      />
      {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
      <ModalRow
        text={translations[lang].amountAtFinish}
        value={amountAtFinish && `${formatNumber(amountAtFinish, symbol, true)}`}
        asset={symbol}
        line
      />
      <ModalRow
        text={translations[lang].amountToReceive}
        value={formatNumber(formatFixed(amountToWithdraw, decimals), symbol, true)}
        asset={symbol}
        line
      />
      {isEarlyWithdraw && (
        <ModalRowEditable
          value={slippage}
          editable={editSlippage}
          symbol="%"
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            setSlippage(value);
          }}
          onClick={() => {
            if (!slippage) setSlippage(DEFAULT_SLIPPAGE);
            setEditSlippage((prev) => !prev);
          }}
          line
        />
      )}
      <ModalRow
        text="Min amount to withdraw"
        value={formatNumber(formatFixed(minAmountToWithdraw, decimals), symbol, true)}
        asset={symbol}
        line
      />
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
        {requiresApproval ? translations[lang].approve : translations[lang].withdraw}
      </LoadingButton>
    </>
  );
};

export default React.memo(WithdrawAtMaturity);
