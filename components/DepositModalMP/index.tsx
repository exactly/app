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
  const { web3Provider, walletAddress } = useWeb3Context();

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
  const [step, setStep] = useState<number>(1);
  const [pending, setPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<string>('0.5');
  const [editSlippage, setEditSlippage] = useState<boolean>(false);
  const [fixedRate, setFixedRate] = useState<string>('0.00');
  const [error, setError] = useState<Error | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const marketAddress = editable ? address?.value ?? market ?? fixedLenderData[0].address : market;

  const symbol = getSymbol(marketAddress);

  const underlyingData: UnderlyingData | undefined = getUnderlyingData(
    process.env.NEXT_PUBLIC_NETWORK!,
    symbol.toLowerCase()
  );

  const underlyingContract = getContractData(
    underlyingData!.address,
    underlyingData!.abi,
    web3Provider?.getSigner()
  );

  const previewerContract = getContractData(previewerData.address!, previewerData.abi!);

  useEffect(() => {
    getFixedLenderContract();
  }, [address, market]);

  useEffect(() => {
    if (underlyingContract && fixedLenderWithSigner) {
      getWalletBalance();
    }
  }, [underlyingContract, fixedLenderWithSigner]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

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
      setStep((step) => step + 1);
    } catch (e) {
      setLoading(false);

      setError({
        status: true
      });
    }
  }

  async function getWalletBalance() {
    const walletBalance = await underlyingContract?.balanceOf(walletAddress);

    const formattedBalance = walletBalance && ethers.utils.formatEther(walletBalance);

    if (formattedBalance) {
      setWalletBalance(formattedBalance);
    }
  }

  async function onMax() {
    walletBalance && setQty(walletBalance);
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

      const deposit = await fixedLenderWithSigner?.depositAtMaturity(
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(qty!),
        ethers.utils.parseUnits(`${minAmount}`),
        walletAddress
      );

      setTx({ status: 'processing', hash: deposit?.hash });

      const status = await deposit.wait();

      setTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      setLoading(false);
      setError({
        status: true,
        message: translations[lang].notEnoughSlippage
      });
    }
  }

  async function estimateGas() {
    try {
      const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

      const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.depositAtMaturity(
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(`${numbers.estimateGasAmount}`),
        ethers.utils.parseUnits('0'),
        walletAddress
      );

      if (gasPriceInGwei && estimatedGasCost) {
        const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
        const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
        const eth = parseFloat(gwei) * parseFloat(gasCost);

        setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
      }
    } catch (e) {
      setError({
        status: true,
        message: translations[lang].notEnoughBalance,
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
    if (!qty) return;
    try {
      const yieldAtMaturity = await previewerContract?.previewDepositAtMaturity(
        marketAddress,
        parseInt(date?.value ?? maturity),
        ethers.utils.parseUnits(qty)
      );

      const fixedRate =
        (parseFloat(
          ethers.utils.formatUnits(yieldAtMaturity, decimals[symbol! as keyof Decimals])
        ) *
          100) /
        parseFloat(qty);

      setFixedRate(fixedRate.toFixed(2));
    } catch (e) {
      console.log(e);
    }
  }

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((contract) => {
      return contract.address == marketAddress;
    });

    const fixedLender = await getContractData(
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
              <ModalTitle title={translations[lang].deposit} />
              <ModalAsset
                asset={symbol}
                amount={walletBalance}
                editable={editable}
                defaultAddress={marketAddress}
              />
              <ModalClose closeModal={closeModal} />
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
              <ModalRow text={translations[lang].interestRate} value={`${fixedRate}%`} line />
              <ModalRowEditable
                text={translations[lang].minimumDepositRate}
                value={slippage}
                editable={editSlippage}
                symbol="%"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSlippage(e.target.value);
                }}
                onClick={() => {
                  if (slippage == '') setSlippage('0.5');
                  setEditSlippage((prev) => !prev);
                }}
                line
              />
              <ModalStepper currentStep={step} totalSteps={3} />
              {error && <ModalError message={error.message} />}
              <div className={styles.buttonContainer}>
                <Button
                  text={step == 1 ? translations[lang].approve : translations[lang].deposit}
                  className={qty && qty > '0' && !error?.status ? 'primary' : 'disabled'}
                  disabled={((!qty || qty <= '0') && !pending) || loading || error?.status}
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
