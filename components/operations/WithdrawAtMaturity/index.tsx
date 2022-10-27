import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Contract, ethers } from 'ethers';
import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';

import Button from 'components/common/Button';
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
import { Gas } from 'types/Gas';
import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';

import formatNumber from 'utils/formatNumber';
import handleETH from 'utils/handleETH';
import { getSymbol } from 'utils/utils';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';

import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import ContractsContext from 'contexts/ContractsContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import PreviewerContext from 'contexts/PreviewerContext';
import { useWeb3Context } from 'contexts/Web3Context';

import numbers from 'config/numbers.json';

import keys from './translations.json';

function WithdrawAtMaturity() {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { getInstance } = useContext(ContractsContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);

  const [qty, setQty] = useState<string>('');
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [slippage, setSlippage] = useState<string>('0');
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<ErrorData | undefined>(undefined);
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0');

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(undefined);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  const debounceQty = useDebounce(qty);

  const ETHrouter = web3Provider && symbol == 'WETH' && handleETH(network?.name, web3Provider?.getSigner());

  const isEarlyWithdraw = useMemo(() => {
    return Date.now() / 1000 < parseInt(date!.value);
  }, [date]);

  const positionAssets = useMemo(() => {
    if (!accountData) return '0';

    const pool = accountData[symbol].fixedDepositPositions.find((position) => {
      return position.maturity.toNumber().toString() === date!.value;
    });
    const positionAssets = pool ? pool.position.principal.add(pool.position.fee) : ethers.constants.Zero;

    return positionAssets;
  }, [date, accountData, symbol]);

  const amountAtFinish = useMemo(() => {
    if (!accountData || !symbol) return undefined;

    const decimals = accountData[symbol].decimals;

    return formatFixed(positionAssets, decimals);
  }, [accountData, symbol]);

  useEffect(() => {
    setQty('');
  }, [symbol, date]);

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    checkAllowance();
  }, [walletAddress, fixedLenderWithSigner, symbol, debounceQty]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  useEffect(() => {
    previewWithdrawAtMaturity();
  }, [debounceQty]);

  async function checkAllowance() {
    if (symbol != 'WETH' || !ETHrouter || !walletAddress || !fixedLenderWithSigner) return;

    const allowance = await ETHrouter.checkAllowance(walletAddress, fixedLenderWithSigner);

    if ((allowance && parseFloat(allowance) < parseFloat(qty)) || (allowance && parseFloat(allowance) == 0 && !qty)) {
      setNeedsApproval(true);
    }
  }

  function onMax() {
    const { decimals } = accountData![symbol];
    setQty(formatFixed(positionAssets, decimals));
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (!accountData || !symbol) return;
    const decimals = accountData[symbol].decimals;

    if (e.target.value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(e.target.value)![0];
      if (inputDecimals.length > decimals) return;
    }

    const parsedValue = parseFixed(e.target.value || '0', decimals);

    if (parsedValue.gt(positionAssets)) {
      setError({
        status: true,
        message: translations[lang].insufficientBalance,
        component: 'input',
      });
    } else {
      setError(undefined);
    }

    setQty(e.target.value);
  }

  async function previewWithdrawAtMaturity() {
    if (!accountData || !symbol || !date) return;

    if (qty == '') {
      setWithdrawAmount('0');
      return;
    }

    const decimals = accountData[symbol].decimals;

    const market = fixedLenderWithSigner?.address;
    const parsedMaturity = parseInt(date.value);
    const parsedQtyValue = ethers.utils.parseUnits(qty, decimals);
    const WAD = parseFixed('1', 18);

    const previewerContract = getInstance(previewerData.address!, previewerData.abi!, 'previewer');

    try {
      const withdrawAmount = await previewerContract?.previewWithdrawAtMaturity(market, parsedMaturity, parsedQtyValue);

      const parseSlippage = parseFixed((1 - numbers.slippage).toString(), 18);
      const minimumWithdrawAmount = withdrawAmount.mul(parseSlippage).div(WAD);

      setWithdrawAmount(Number(formatFixed(withdrawAmount, decimals)).toFixed(decimals));
      setSlippage(formatFixed(minimumWithdrawAmount, decimals));
    } catch (e) {
      console.log(e);
    }
  }

  async function withdraw() {
    setLoading(true);

    try {
      if (!accountData || !symbol || !date) return;
      const decimals = accountData[symbol].decimals;
      let withdraw;

      if (symbol == 'WETH') {
        if (!ETHrouter) return;

        withdraw = await ETHrouter?.withdrawAtMaturityETH(date.value, qty, slippage);
      } else {
        const gasLimit = await getGasLimit(qty, slippage);

        withdraw = await fixedLenderWithSigner?.withdrawAtMaturity(
          date.value,
          ethers.utils.parseUnits(qty, decimals),
          ethers.utils.parseUnits(slippage, decimals),
          walletAddress,
          walletAddress,
          {
            gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier) : undefined,
          },
        );
      }

      setTx({ status: 'processing', hash: withdraw?.hash });

      const txReceipt = await withdraw.wait();

      setLoading(false);

      if (txReceipt.status == 1) {
        setTx({ status: 'success', hash: txReceipt?.transactionHash });
      } else {
        setTx({ status: 'error', hash: txReceipt?.transactionHash });
      }

      getAccountData();
    } catch (e: any) {
      console.log(e);
      setLoading(false);

      const isDenied = e?.message?.includes('User denied');

      const txError = e?.message?.includes(`"status":0`);
      let txErrorHash = undefined;

      if (txError) {
        const regex = new RegExp(/"hash":"(.*?)"/g); //regex to get all between ("hash":") and (")
        const preTxHash = e?.message?.match(regex); //get the hash from plain text by the regex
        txErrorHash = preTxHash[0].substring(8, preTxHash[0].length - 1); //parse the string to get the txHash only
      }

      if (isDenied) {
        setError({
          status: true,
          message: isDenied && translations[lang].deniedTransaction,
        });
      } else if (txError) {
        setTx({ status: 'error', hash: txErrorHash });
      } else {
        setError({
          status: true,
          message: translations[lang].generalError,
        });
      }
    }
  }

  async function estimateGas() {
    if (symbol == 'WETH') return;

    try {
      const gasPrice = (await fixedLenderWithSigner?.provider.getFeeData())?.maxFeePerGas;

      const gasLimit = await getGasLimit('1', '0');

      if (gasPrice && gasLimit) {
        const total = formatFixed(gasPrice.mul(gasLimit), 18);

        setGas({ eth: Number(total).toFixed(6) });
      }
    } catch (e) {
      setError({
        status: true,
        component: 'gas',
      });
    }
  }

  async function getGasLimit(qty: string, minQty: string) {
    if (!accountData || !symbol || !date) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.withdrawAtMaturity(
      date.value,
      ethers.utils.parseUnits(qty, decimals),
      ethers.utils.parseUnits(minQty, decimals),
      walletAddress,
      walletAddress,
    );

    return gasLimit;
  }

  async function approve() {
    if (symbol == 'WETH') {
      if (!web3Provider || !ETHrouter || !fixedLenderWithSigner) return;

      try {
        setLoading(true);

        const approve = await ETHrouter.approve(fixedLenderWithSigner);

        await approve.wait();

        setLoading(false);
        setNeedsApproval(false);
      } catch (e: any) {
        setLoading(false);

        const isDenied = e?.message?.includes('User denied');

        setError({
          status: true,
          message: isDenied ? translations[lang].deniedTransaction : translations[lang].notEnoughSlippage,
        });
      }
    }
  }

  function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      const contractSymbol = getSymbol(contract.address!, network!.name);

      return contractSymbol == symbol;
    });

    if (!filteredFixedLender) throw new Error('Market contract not found');
    const fixedLender = getInstance(filteredFixedLender.address!, filteredFixedLender.abi!, `market${symbol}`);

    setFixedLenderWithSigner(fixedLender);
  }

  return (
    <>
      {!tx && (
        <>
          <ModalTitle title={isEarlyWithdraw ? translations[lang].earlyWithdraw : translations[lang].withdraw} />
          <ModalAsset
            asset={symbol!}
            assetTitle={translations[lang].action.toUpperCase()}
            amount={amountAtFinish}
            amountTitle={translations[lang].depositedAmount.toUpperCase()}
          />
          <ModalMaturityEditable text={translations[lang].maturityPool} line />
          <ModalInput
            onMax={onMax}
            value={qty}
            onChange={handleInputChange}
            symbol={symbol!}
            error={error?.component == 'input'}
          />
          {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
          <ModalRow
            text={translations[lang].amountAtFinish}
            value={amountAtFinish && `${formatNumber(amountAtFinish, symbol!, true)}`}
            asset={symbol}
            line
          />
          <ModalRow
            text={translations[lang].amountToReceive}
            value={formatNumber(withdrawAmount, symbol!, true)}
            asset={symbol}
            line
          />
          {isEarlyWithdraw && (
            <ModalRowEditable
              text={translations[lang].amountSlippage}
              value={slippage}
              editable={editSlippage}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSlippage(e.target.value);
                error?.message == translations[lang].notEnoughSlippage && setError(undefined);
              }}
              onClick={() => {
                if (slippage == '') setSlippage('0');
                setEditSlippage((prev) => !prev);
              }}
              line
            />
          )}
          {error && error.component != 'gas' && <ModalError message={error.message} />}
          <div className={styles.buttonContainer}>
            <Button
              text={needsApproval ? translations[lang].approve : translations[lang].withdraw}
              className={parseFloat(qty) <= 0 || !qty || error?.status ? 'disabled' : 'primary'}
              disabled={parseFloat(qty) <= 0 || !qty || loading || error?.status}
              onClick={needsApproval ? approve : withdraw}
              loading={loading}
            />
          </div>
        </>
      )}
      {tx && <ModalGif tx={tx} tryAgain={withdraw} />}
    </>
  );
}

export default WithdrawAtMaturity;
