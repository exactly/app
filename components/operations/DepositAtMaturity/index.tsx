import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalInput from 'components/common/modal/ModalInput';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalError from 'components/common/modal/ModalError';
import ModalCell from 'components/common/modal/ModalCell';

import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Error } from 'types/Error';

import { getSymbol, getUnderlyingData, toPercentage } from 'utils/utils';
import handleEth from 'utils/handleEth';
import getOneDollar from 'utils/getOneDollar';

import numbers from 'config/numbers.json';

import styles from './style.module.scss';

import useDebounce from 'hooks/useDebounce';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { MarketContext } from 'contexts/MarketContext';
import PreviewerContext from 'contexts/PreviewerContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ContractsContext from 'contexts/ContractsContext';

import keys from './translations.json';

function DepositAtMaturity() {
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { date, market } = useContext(MarketContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { getInstance } = useContext(ContractsContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0);
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [fixedRate, setFixedRate] = useState<number | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const debounceQty = useDebounce(qty);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(undefined);
  const [underlyingContract, setUnderlyingContract] = useState<Contract | undefined>(undefined);

  const symbol = useMemo(() => {
    return market?.value ? getSymbol(market.value, network?.name) : 'DAI';
  }, [market?.value, network?.name]);

  useEffect(() => {
    setQty('');
  }, [symbol, date]);

  useEffect(() => {
    getFixedLenderContract();
  }, [market, fixedLenderData]);

  useEffect(() => {
    getUnderlyingContract();
  }, [market, network, symbol]);

  useEffect(() => {
    if (underlyingContract && fixedLenderWithSigner) {
      getWalletBalance();
    }
  }, [underlyingContract, fixedLenderWithSigner, walletAddress]);

  useEffect(() => {
    if (fixedLenderWithSigner) {
      if (step == 1) {
        estimateApprovalGasCost();
      } else if (step == 2) {
        estimateGas();
      }
    }
  }, [fixedLenderWithSigner, step, debounceQty]);

  useEffect(() => {
    checkAllowance();
  }, [market, walletAddress, underlyingContract]);

  useEffect(() => {
    if (fixedLenderWithSigner) {
      getYieldAtMaturity();
    }
  }, [debounceQty, date, market, fixedLenderWithSigner]);

  async function checkAllowance() {
    if (symbol == 'WETH') {
      return setStep(2);
    }

    if (!underlyingContract || !walletAddress || !market) return;

    const allowance = await underlyingContract?.allowance(walletAddress, market?.value);
    const formattedAllowance = allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty == '' ? 0 : parseFloat(qty);
    if (formattedAllowance > amount && !isNaN(amount) && !isNaN(formattedAllowance)) {
      setStep(2);
    } else {
      setStep(1);
    }
  }

  async function approve() {
    if (symbol == 'WETH' || !underlyingContract) return;

    try {
      const gasLimit = await getApprovalGasLimit();
      const approval = await underlyingContract?.approve(market?.value, ethers.constants.MaxUint256, {
        gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier) : undefined,
      });

      //we set the transaction as pending
      setPending((pending) => !pending);

      await approval.wait();

      //we set the transaction as done
      setPending((pending) => !pending);
      setLoading(false);

      //once the tx is done we update the step
      setStep(2);
    } catch (e) {
      console.log(e);
      setLoading(false);
      setError({
        status: true,
      });
    }
  }

  async function getWalletBalance() {
    let walletBalance;
    let decimals;

    if (symbol == 'WETH') {
      walletBalance = await web3Provider?.getBalance(walletAddress!);
      decimals = 18;
    } else {
      walletBalance = await underlyingContract?.balanceOf(walletAddress);
      decimals = await underlyingContract?.decimals();
    }

    const formattedBalance = walletBalance && ethers.utils.formatUnits(walletBalance, decimals);

    if (formattedBalance) {
      setWalletBalance(formattedBalance);
    }
  }

  async function onMax() {
    if (walletBalance) {
      setQty(walletBalance);
      setError(undefined);
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (!accountData) return;
    const decimals = accountData[symbol.toUpperCase()].decimals;

    if (e.target.value.includes('.')) {
      const regex = /[^,.]*$/g;
      const inputDecimals = regex.exec(e.target.value)![0];
      if (inputDecimals.length > decimals) return;
    }

    if (step != 1 && walletBalance && e.target.valueAsNumber > parseFloat(walletBalance)) {
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

  async function deposit() {
    try {
      if (!accountData || !date) return;

      const decimals = accountData[symbol].decimals;
      const minAmount = parseFloat(qty!) * (1 - slippage);

      let deposit;

      if (symbol === 'WETH') {
        const ETHrouter = web3Provider && handleEth(network?.name, web3Provider?.getSigner());

        deposit = await ETHrouter?.depositAtMaturityETH(date.value, minAmount.toString(), qty!);
      } else {
        const gasLimit = await getGasLimit(qty, minAmount.toFixed(decimals));

        deposit = await fixedLenderWithSigner?.depositAtMaturity(
          parseInt(date.value),
          ethers.utils.parseUnits(qty!, decimals),
          ethers.utils.parseUnits(`${minAmount.toFixed(decimals)}`, decimals),
          walletAddress,
          {
            gasLimit: gasLimit ? Math.ceil(Number(formatFixed(gasLimit)) * numbers.gasLimitMultiplier) : undefined,
          },
        );
      }

      setTx({ status: 'processing', hash: deposit?.hash });

      const txReceipt = await deposit.wait();

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
    if (symbol === 'WETH') return;

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
    if (!accountData || !date) return;

    const decimals = accountData[symbol].decimals;

    const gasLimit = await fixedLenderWithSigner?.estimateGas.depositAtMaturity(
      parseInt(date.value),
      ethers.utils.parseUnits(qty, decimals),
      ethers.utils.parseUnits(minQty, decimals),
      walletAddress,
    );

    return gasLimit;
  }

  async function getApprovalGasLimit() {
    const gasLimit = await underlyingContract?.estimateGas.approve(market?.value, ethers.constants.MaxUint256);

    return gasLimit;
  }

  async function estimateApprovalGasCost() {
    if (symbol == 'WETH') return;

    try {
      const gasPrice = (await fixedLenderWithSigner?.provider.getFeeData())?.maxFeePerGas;

      const gasLimit = await getApprovalGasLimit();

      if (gasPrice && gasLimit) {
        const total = formatFixed(gasPrice.mul(gasLimit), 18);

        setGas({ eth: Number(total).toFixed(6) });
      }
    } catch (e) {
      console.log(e);
      setError({
        status: true,
        message: translations[lang].error,
        component: 'gas',
      });
    }
  }

  function handleClickAction() {
    setLoading(true);

    if (step === 1 && !pending && symbol != 'WETH') {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  }

  async function getYieldAtMaturity() {
    if (!accountData || !date) return;

    try {
      const decimals = accountData[symbol.toUpperCase()].decimals;
      const currentTimestamp = new Date().getTime() / 1000;
      const time = 31_536_000 / (parseInt(date?.value) - currentTimestamp);
      const oracle = accountData[symbol.toUpperCase()]?.usdPrice;

      const qtyValue = qty == '' ? getOneDollar(oracle, decimals) : parseFixed(qty, decimals);

      const previewerContract = getInstance(previewerData.address!, previewerData.abi!, 'previewer');

      const feeAtMaturity = await previewerContract?.previewDepositAtMaturity(
        market?.value,
        parseInt(date.value),
        qtyValue,
      );

      const initialAssets = qtyValue;
      const finalAssets = feeAtMaturity.assets;

      const rate = finalAssets.mul(parseFixed('1', 18)).div(initialAssets);

      const fixedAPR = (Number(formatFixed(rate, 18)) - 1) * time;

      const slippageAPR = fixedAPR * (1 - numbers.slippage);

      if (fixedAPR < numbers.minAPRValue) {
        setError({
          status: true,
          message: translations[lang].zeroRate,
          component: 'input',
        });
      }

      setSlippage(slippageAPR);
      setFixedRate(fixedAPR);
    } catch (e) {
      console.log(e);
    }
  }

  function getFixedLenderContract() {
    if (!market) return;

    const filteredFixedLender = fixedLenderData.find((contract) => {
      return contract.address == market.value;
    });

    if (!filteredFixedLender) throw new Error('Market contract not found');
    const fixedLender = getInstance(filteredFixedLender.address!, filteredFixedLender.abi!, `market${symbol}`);

    setFixedLenderWithSigner(fixedLender);
  }

  function getUnderlyingContract() {
    const underlyingData: UnderlyingData | undefined = getUnderlyingData(network?.name, symbol.toLowerCase());

    const underlyingContract = getInstance(underlyingData!.address, underlyingData!.abi, `underlying${symbol}`);

    setUnderlyingContract(underlyingContract);
  }

  return (
    <>
      {!tx && (
        <>
          <ModalTitle title={translations[lang].fixedRateDeposit} />
          <ModalAsset
            asset={symbol}
            assetTitle={translations[lang].action.toUpperCase()}
            amount={walletBalance}
            amountTitle={translations[lang].walletBalance.toUpperCase()}
          />
          <section className={styles.maturityRowModal}>
            <ModalMaturityEditable text={translations[lang].maturityPool.toUpperCase()} />
            <ModalCell text={translations[lang].apr.toUpperCase()} value={toPercentage(fixedRate)} column />
          </section>
          <ModalInput
            onMax={onMax}
            value={qty}
            onChange={handleInputChange}
            symbol={symbol!}
            error={error?.component == 'input'}
          />
          {error?.component !== 'gas' && symbol != 'WETH' && <ModalTxCost gas={gas} />}
          <ModalRowEditable
            text={translations[lang].minimumApr}
            value={toPercentage(slippage)}
            editable={editSlippage}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSlippage(Number(e.target.value));
              error?.message == translations[lang].notEnoughSlippage && setError(undefined);
            }}
            onClick={() => {
              setEditSlippage((prev) => !prev);
            }}
            line
          />
          <ModalStepper currentStep={step} totalSteps={3} />
          {error && error.component != 'gas' && <ModalError message={error.message} />}
          <div className={styles.buttonContainer}>
            <Button
              text={step == 1 ? translations[lang].approve : translations[lang].deposit}
              className={qty && parseFloat(qty) > 0 && !error?.status ? 'primary' : 'disabled'}
              disabled={((!qty || parseFloat(qty) <= 0) && !pending) || loading || error?.status}
              onClick={handleClickAction}
              loading={loading}
            />
          </div>
        </>
      )}
      {tx && <ModalGif tx={tx} tryAgain={deposit} />}
    </>
  );
}

export default DepositAtMaturity;
