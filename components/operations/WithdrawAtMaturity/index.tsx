import { BigNumber, formatFixed, parseFixed } from '@ethersproject/bignumber';
import React, { ChangeEvent, FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WeiPerEther, Zero } from '@ethersproject/constants';
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

import { ErrorData } from 'types/Error';
import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';

import formatNumber from 'utils/formatNumber';
import { getSymbol } from 'utils/utils';

import useDebounce from 'hooks/useDebounce';

import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import numbers from 'config/numbers.json';

import keys from './translations.json';
import useMarket from 'hooks/useMarket';
import useETHRouter from 'hooks/useETHRouter';
import useApprove from 'hooks/useApprove';
import handleOperationError from 'utils/handleOperationError';
import usePreviewer from 'hooks/usePreviewer';
import analytics from 'utils/analytics';

const DEFAULT_AMOUNT = BigNumber.from(numbers.defaultAmount);
const DEFAULT_SLIPPAGE = (100 * numbers.slippage).toFixed(2);

const WithdrawAtMaturity: FC = () => {
  const { walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const previewerContract = usePreviewer();

  const [qty, setQty] = useState('');
  const [gasCost, setGasCost] = useState<BigNumber | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>();
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [editSlippage, setEditSlippage] = useState(false);
  const [isLoadingOp, setIsLoadingOp] = useState(false);

  const [errorData, setErrorData] = useState<ErrorData | undefined>();
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [minAmountToWithdraw, setMinAmountToWithdraw] = useState(Zero);
  const [amountToWithdraw, setAmountToWithdraw] = useState(Zero);

  const marketContract = useMarket(market?.value);
  const ETHRouterContract = useETHRouter();

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const rawSlippage = useMemo(() => parseFixed(String(1 - Number(slippage) / 100), 18), [slippage]);

  const debounceQty = useDebounce(qty);
  const decimals = useMemo(() => (accountData && accountData[symbol].decimals) || 18, [accountData, symbol]);

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

  useEffect(() => {
    setQty('');
    setErrorData(undefined);
  }, [symbol, date]);

  const {
    approve,
    estimateGas: approveEstimateGas,
    isLoading: approveIsLoading,
    errorData: approveErrorData,
  } = useApprove(marketContract, ETHRouterContract?.address);

  const isLoading = useMemo(() => isLoadingOp || approveIsLoading, [isLoadingOp, approveIsLoading]);

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
    );

    setAmountToWithdraw(amount);
    setMinAmountToWithdraw(isEarlyWithdraw ? amount.mul(rawSlippage).div(WeiPerEther) : amount);
  }, [decimals, date, qty, marketContract, previewerContract, rawSlippage, isEarlyWithdraw]);

  useEffect(() => {
    if (errorData?.status) return;
    previewWithdrawAtMaturity().catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [debounceQty, previewWithdrawAtMaturity, errorData?.status]);

  const previewGasCost = useCallback(async () => {
    if (isLoading || !walletAddress || !marketContract || !ETHRouterContract || !date || !qty) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      // only WETH needs allowance -> estimates directly with the ETH router
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation?.mul(gasPrice));
    }

    const amount = amountToWithdraw.isZero() ? DEFAULT_AMOUNT : amountToWithdraw;

    if (symbol === 'WETH') {
      const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(
        date.value,
        amount,
        minAmountToWithdraw,
      );
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
      date.value,
      amount,
      minAmountToWithdraw,
      walletAddress,
      walletAddress,
    );

    setGasCost(gasPrice.mul(gasEstimation));
  }, [
    isLoading,
    qty,
    amountToWithdraw,
    ETHRouterContract,
    approveEstimateGas,
    marketContract,
    needsApproval,
    symbol,
    walletAddress,
    date,
    minAmountToWithdraw,
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
  }, [lang, previewGasCost, translations, errorData?.status]);

  const onMax = useCallback(() => setQty(formatFixed(positionAssets, decimals)), [decimals, positionAssets]);

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
    [decimals, positionAssets, translations, lang],
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

      getAccountData();
    } catch (error) {
      if (withdrawTx) setTx({ status: 'error', hash: withdrawTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [
    date,
    symbol,
    qty,
    ETHRouterContract,
    marketContract,
    walletAddress,
    getAccountData,
    minAmountToWithdraw,
    decimals,
  ]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      setNeedsAllowance(await needsApproval());
      return;
    }

    void analytics.track('withdrawAtMaturityRequest', {
      amount: qty,
      maturity: date?.value,
      asset: symbol,
    });

    return withdraw();
  }, [isLoading, needsAllowance, qty, date?.value, symbol, withdraw, approve, approveErrorData, needsApproval]);

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
        disabled={parseFloat(qty) <= 0 || !qty || isLoading || errorData?.status}
      >
        {needsAllowance ? translations[lang].approve : translations[lang].withdraw}
      </LoadingButton>
    </>
  );
};

export default WithdrawAtMaturity;
