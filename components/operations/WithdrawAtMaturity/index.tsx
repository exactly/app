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
  const [withdrawAmount, setWithdrawAmount] = useState('0');

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
      setWithdrawAmount('0');
      return;
    }

    const parsedQtyValue = parseFixed(qty, decimals);
    const amountToWithdraw = await previewerContract.previewWithdrawAtMaturity(
      marketContract.address,
      date.value,
      parsedQtyValue,
    );

    const minimumWithdrawAmount = amountToWithdraw.mul(rawSlippage).div(WeiPerEther);

    setWithdrawAmount(formatFixed(minimumWithdrawAmount, decimals));
  }, [decimals, date, qty, marketContract, previewerContract, rawSlippage]);

  useEffect(() => {
    previewWithdrawAtMaturity().catch((error) => setErrorData({ status: true, message: handleOperationError(error) }));
  }, [debounceQty, previewWithdrawAtMaturity]);

  const previewGasCost = useCallback(async () => {
    if (!walletAddress || !marketContract || !ETHRouterContract || !date) return;

    const gasPrice = (await ETHRouterContract.provider.getFeeData()).maxFeePerGas;
    if (!gasPrice) return;

    if (await needsApproval()) {
      // only WETH needs allowance -> estimates directly with the ETH router
      const gasEstimation = await approveEstimateGas();
      return setGasCost(gasEstimation?.mul(gasPrice));
    }

    if (symbol === 'WETH') {
      const amount = qty ? parseFixed(qty, 18) : DEFAULT_AMOUNT;
      const minAsset = amount.mul(rawSlippage).div(WeiPerEther);
      const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(
        date.value,
        parseFixed(qty, 18),
        minAsset,
      );
      return setGasCost(gasPrice.mul(gasEstimation));
    }

    const assetDecimals = await marketContract.decimals();
    const amount = qty ? parseFixed(qty, assetDecimals) : DEFAULT_AMOUNT;
    const minAsset = amount.mul(rawSlippage).div(WeiPerEther);
    const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
      date.value,
      amount,
      minAsset,
      walletAddress,
      walletAddress,
    );
    setGasCost(gasPrice.mul(gasEstimation));
  }, [
    rawSlippage,
    ETHRouterContract,
    approveEstimateGas,
    marketContract,
    needsApproval,
    qty,
    symbol,
    walletAddress,
    date,
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
      if (value.includes('.')) {
        const regex = /[^,.]*$/g;
        const inputDecimals = regex.exec(value)![0];
        if (inputDecimals.length > decimals) return;
      }

      const parsedValue = parseFixed(value || '0', decimals);

      if (parsedValue.gt(positionAssets)) {
        return setErrorData({
          status: true,
          message: translations[lang].insufficientBalance,
          component: 'input',
        });
      }

      setErrorData(undefined);
      setQty(value);
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

        const amount = parseFixed(qty, 18);
        const slippageAmount = amount.mul(rawSlippage).div(WeiPerEther);

        const gasEstimation = await ETHRouterContract.estimateGas.withdrawAtMaturity(
          date.value,
          amount,
          slippageAmount,
        );
        withdrawTx = await ETHRouterContract.withdrawAtMaturity(date.value, amount, slippageAmount, {
          gasLimit: gasEstimation.mul(parseFixed(String(numbers.gasLimitMultiplier), 18)).div(WeiPerEther),
        });
      } else {
        const amount = parseFixed(qty, decimals);
        const slippageAmount = amount.mul(rawSlippage).div(WeiPerEther);

        const gasEstimation = await marketContract.estimateGas.withdrawAtMaturity(
          date.value,
          amount,
          slippageAmount,
          walletAddress,
          walletAddress,
        );

        withdrawTx = await marketContract.withdrawAtMaturity(
          date.value,
          amount,
          slippageAmount,
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

      getAccountData();
    } catch (error) {
      if (withdrawTx) setTx({ status: 'error', hash: withdrawTx?.hash });
      setErrorData({ status: true, message: handleOperationError(error) });
    } finally {
      setIsLoadingOp(false);
    }
  }, [decimals, date, symbol, qty, rawSlippage, ETHRouterContract, marketContract, walletAddress, getAccountData]);

  const handleSubmitAction = useCallback(async () => {
    if (isLoading) return;
    if (needsAllowance) {
      await approve();
      setErrorData(approveErrorData);
      setNeedsAllowance(await needsApproval());
      return;
    }
    return withdraw();
  }, [needsAllowance, approve, isLoading, approveErrorData, needsApproval, withdraw]);

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
        value={formatNumber(withdrawAmount, symbol, true)}
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
      <ModalRow text="Min amount to withdraw" value={withdrawAmount} asset={symbol} line />
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
