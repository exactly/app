import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';

import Button from 'components/common/Button';
import ModalAsset from 'components/common/modal/ModalAsset';
import ModalClose from 'components/common/modal/ModalClose';
import ModalInput from 'components/common/modal/ModalInput';
import ModalRow from 'components/common/modal/ModalRow';
import ModalTitle from 'components/common/modal/ModalTitle';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalMinimized from 'components/common/modal/ModalMinimized';
import ModalWrapper from 'components/common/modal/ModalWrapper';
import ModalGif from 'components/common/modal/ModalGif';
import ModalStepper from 'components/common/modal/ModalStepper';
import Overlay from 'components/Overlay';
import ModalRowEditable from 'components/common/modal/ModalRowEditable';
import ModalMaturityEditable from 'components/common/modal/ModalMaturityEditable';
import ModalError from 'components/common/modal/ModalError';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { LangKeys } from 'types/Lang';
import { UnderlyingData } from 'types/Underlying';
import { Gas } from 'types/Gas';
import { Transaction } from 'types/Transaction';
import { Decimals } from 'types/Decimals';
import { Error } from 'types/Error';

import { getContractData } from 'utils/contracts';
import { getSymbol, getUnderlyingData } from 'utils/utils';
import parseTimestamp from 'utils/parseTimestamp';

import numbers from 'config/numbers.json';
import decimals from 'config/decimals.json';

import styles from './style.module.scss';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import PreviewerContext from 'contexts/PreviewerContext';

import keys from './translations.json';

type Props = {
  data: Borrow | Deposit;
  editable?: boolean;
  closeModal: (props: any) => void;
};

function DepositModalMP({ data, editable, closeModal }: Props) {
  const { maturity, market } = data;
  const { web3Provider, walletAddress, network } = useWeb3Context();
  const { date, address } = useContext(AddressContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const fixedLenderData = useContext(FixedLenderContext);
  const previewerData = useContext(PreviewerContext);

  const [qty, setQty] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [gas, setGas] = useState<Gas | undefined>();
  const [tx, setTx] = useState<Transaction | undefined>(undefined);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<string>('0.00');
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [fixedRate, setFixedRate] = useState<string>('0.00');
  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const marketAddress = editable ? address?.value ?? market ?? fixedLenderData[0].address : market;

  const symbol = getSymbol(marketAddress, network?.name);

  const underlyingData: UnderlyingData | undefined = getUnderlyingData(
    network?.name,
    symbol.toLowerCase()
  );

  const underlyingContract = getContractData(
    network?.name,
    underlyingData!.address,
    underlyingData!.abi,
    web3Provider?.getSigner()
  );

  const previewerContract = getContractData(
    network?.name,
    previewerData.address!,
    previewerData.abi!
  );

  useEffect(() => {
    getFixedLenderContract();
  }, [address, market, fixedLenderData]);

  useEffect(() => {
    if (underlyingContract && fixedLenderWithSigner) {
      getWalletBalance();
    }
  }, [underlyingContract, fixedLenderWithSigner]);

  useEffect(() => {
    if (fixedLenderWithSigner) {
      if (step == 1) {
        estimateApprovalGasCost();
      } else if (step == 2) {
        estimateGas();
      }
    }
  }, [fixedLenderWithSigner, step]);

  useEffect(() => {
    checkAllowance();
  }, [address, market, walletAddress, underlyingContract]);

  useEffect(() => {
    if (underlyingContract) {
      getYieldAtMaturity();
    }
  }, [underlyingContract, qty, maturity, date, market]);

  async function checkAllowance() {
    const allowance = await underlyingContract?.allowance(walletAddress, marketAddress);

    const formattedAllowance = allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty == '' ? 0 : parseFloat(qty);

    if (formattedAllowance > amount && !isNaN(amount) && !isNaN(formattedAllowance)) {
      setStep(2);
    } else {
      setStep(1);
    }
  }

  async function approve() {
    try {
      const approval = await underlyingContract?.approve(
        marketAddress,
        ethers.utils.parseUnits(numbers.approvalAmount!.toString())
      );

      //we set the transaction as pending
      setPending((pending) => !pending);

      await approval.wait();

      //we set the transaction as done
      setPending((pending) => !pending);
      setLoading(false);

      //once the tx is done we update the step
      setStep(2);
    } catch (e) {
      setLoading(false);

      setError({
        status: true
      });
    }
  }

  async function getWalletBalance() {
    const walletBalance = await underlyingContract?.balanceOf(walletAddress);
    const decimals = await underlyingContract?.decimals();
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
    if (step != 1 && walletBalance && e.target.valueAsNumber > parseFloat(walletBalance)) {
      setError({
        status: true,
        message: translations[lang].insufficientBalance,
        component: 'input'
      });
    } else {
      setError(undefined);
    }

    setQty(e.target.value);
  }

  async function deposit() {
    try {
      const minAmount = parseFloat(qty!) * (1 + parseFloat(slippage) / 100);
      const decimals = await fixedLenderWithSigner?.decimals();

      const deposit = await fixedLenderWithSigner?.depositAtMaturity(
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(qty!, decimals),
        ethers.utils.parseUnits(`${minAmount}`, decimals),
        walletAddress
      );

      setTx({ status: 'processing', hash: deposit?.hash });

      const status = await deposit.wait();

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e: any) {
      setLoading(false);

      const isDenied = e?.message?.includes('User denied');

      setError({
        status: true,
        message: isDenied
          ? translations[lang].deniedTransaction
          : translations[lang].notEnoughSlippage
      });
    }
  }

  async function estimateGas() {
    try {
      const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();
      const decimals = await fixedLenderWithSigner?.decimals();

      const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.depositAtMaturity(
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(`1`, decimals),
        ethers.utils.parseUnits('0', decimals),
        walletAddress
      );

      if (gasPriceInGwei && estimatedGasCost) {
        const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
        const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
        const eth = parseFloat(gwei) * parseFloat(gasCost);

        setGas({ eth: eth.toFixed(6), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      setError({
        status: true,
        component: 'gas'
      });
    }
  }

  async function estimateApprovalGasCost() {
    try {
      const gasPriceInGwei = await underlyingContract?.provider.getGasPrice();

      const estimatedGasCost = await underlyingContract?.estimateGas.approve(
        market,
        ethers.utils.parseUnits(numbers.approvalAmount!.toString())
      );

      if (gasPriceInGwei && estimatedGasCost) {
        const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
        const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
        const eth = parseFloat(gwei) * parseFloat(gasCost);

        setGas({ eth: eth.toFixed(6), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      console.log(e);
      setError({
        status: true,
        message: translations[lang].error,
        component: 'gas'
      });
    }
  }

  function handleClickAction() {
    setLoading(true);

    if (step === 1 && !pending) {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  }

  async function getYieldAtMaturity() {
    if (!qty || parseFloat(qty) <= 0) return;

    try {
      const decimals = await fixedLenderWithSigner?.decimals();

      const yieldAtMaturity = await previewerContract?.previewDepositAtMaturity(
        marketAddress,
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(qty, decimals)
      );

      const currentTimestamp = new Date().getTime() / 1000;

      const time = 31536000 / (parseInt(date?.value ?? maturity) - currentTimestamp);

      const rate =
        (parseFloat(ethers.utils.formatUnits(yieldAtMaturity, decimals)) - parseFloat(qty)) /
        parseFloat(qty);

      const fixedAPY = (Math.pow(1 + rate, time) - 1) * 100;

      setFixedRate(fixedAPY.toFixed(2));
    } catch (e) {
      console.log(e);
    }
  }

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      return contract.address == marketAddress;
    });

    const fixedLender = await getContractData(
      network?.name,
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      web3Provider?.getSigner()
    );

    setFixedLenderWithSigner(fixedLender);
  }

  return (
    <>
      {!minimized && (
        <ModalWrapper closeModal={closeModal}>
          {!tx && (
            <>
              <ModalTitle title={translations[lang].fixedRateDeposit} />
              <ModalAsset
                asset={symbol}
                amount={walletBalance}
                editable={editable}
                defaultAddress={marketAddress}
              />
              <ModalMaturityEditable
                text={translations[lang].maturityPool}
                value={date?.label ?? parseTimestamp(maturity)}
                editable={editable}
              />
              <ModalInput
                onMax={onMax}
                value={qty}
                onChange={handleInputChange}
                symbol={symbol!}
                error={error?.component == 'input'}
              />
              {error?.component !== 'gas' && <ModalTxCost gas={gas} />}
              <ModalRow text={translations[lang].apy} value={`${fixedRate}%`} line />
              <ModalRowEditable
                text={translations[lang].minimumApy}
                value={slippage}
                editable={editSlippage}
                symbol="%"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSlippage(e.target.value);
                }}
                onClick={() => {
                  if (slippage == '') setSlippage('0.00');
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
                  disabled={
                    ((!qty || parseFloat(qty) <= 0) && !pending) || loading || error?.status
                  }
                  onClick={handleClickAction}
                  loading={loading}
                />
              </div>
            </>
          )}
          {tx && <ModalGif tx={tx} />}
        </ModalWrapper>
      )}

      {tx && minimized && (
        <ModalMinimized
          tx={tx}
          handleMinimize={() => {
            setMinimized((prev) => !prev);
          }}
        />
      )}

      {!minimized && (
        <Overlay
          closeModal={
            !tx || tx.status == 'success'
              ? closeModal
              : () => {
                  setMinimized((prev) => !prev);
                }
          }
        />
      )}
    </>
  );
}

export default DepositModalMP;
