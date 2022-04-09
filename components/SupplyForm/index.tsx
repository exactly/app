import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';

import style from './style.module.scss';

import Input from 'components/common/Input';
import Button from 'components/common/Button';
import MaturitySelector from 'components/MaturitySelector';
import Stepper from 'components/Stepper';
import Tooltip from 'components/Tooltip';

import { SupplyRate } from 'types/SupplyRate';
import { Error } from 'types/Error';
import { Gas } from 'types/Gas';
import { Market } from 'types/Market';
import { UnderlyingData } from 'types/Underlying';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';

import { getUnderlyingData } from 'utils/utils';
import { getContractData } from 'utils/contracts';

import { AddressContext } from 'contexts/AddressContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import keys from './translations.json';

import numbers from 'config/numbers.json';

type Props = {
  handleResult: (data: SupplyRate | undefined) => void;
  contractAddress: string;
  assetData: Market | undefined;
  handleTx: (data: Transaction) => void;
};

function SupplyForm({ handleResult, contractAddress, assetData, handleTx }: Props) {
  const { date } = useContext(AddressContext);
  const { address, web3Provider } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const [step, setStep] = useState<number>(1);
  const [pending, setPending] = useState<boolean>(false);

  const [gas, setGas] = useState<Gas | undefined>(undefined);

  let underlyingData: UnderlyingData | undefined = undefined;

  if (assetData?.symbol) {
    underlyingData = getUnderlyingData(process.env.NEXT_PUBLIC_NETWORK!, assetData.symbol);
  }

  const underlyingContract = getContractData(
    underlyingData!.address,
    underlyingData!.abi,
    web3Provider?.getSigner()
  );

  const filteredFixedLender = fixedLenderData.find((fl) => fl.address == contractAddress);

  const fixedLenderWithSigner = getContractData(
    filteredFixedLender?.address!,
    filteredFixedLender?.abi!,
    web3Provider?.getSigner()
  );

  useEffect(() => {
    if (fixedLenderWithSigner) {
      calculateRate();
    }
  }, [qty, date, fixedLenderWithSigner]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner, address, date]);

  useEffect(() => {
    if (underlyingContract) {
      checkAllowance();
    }
  }, [address, contractAddress, underlyingContract]);

  async function checkAllowance() {
    const allowance = await underlyingContract?.allowance(address, contractAddress);

    const formattedAllowance = allowance && parseFloat(ethers.utils.formatEther(allowance));

    const amount = qty ?? 0;

    if (formattedAllowance > amount && !isNaN(amount) && !isNaN(formattedAllowance)) {
      setStep(2);
    }
  }

  async function estimateGas() {
    if (!date) return;

    const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

    const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.depositAtMaturity(
      parseInt(date.value),
      ethers.utils.parseUnits(1!.toString()),
      ethers.utils.parseUnits(1!.toString()),
      address
    );

    if (gasPriceInGwei && estimatedGasCost) {
      const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
      const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
      const eth = parseFloat(gwei) * parseFloat(gasCost);

      setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
    }
  }

  async function calculateRate() {
    handleLoading(false);

    //Supply
    try {
      handleResult({ potentialRate: '0.00', hasRate: true });
    } catch (e) {
      console.log(e);
      return setError({ status: true, msg: translations[lang].error });
    }
  }

  async function deposit() {
    if (!qty || !date) {
      return setError({ status: true, msg: translations[lang].error });
    }

    try {
      const tx = await fixedLenderWithSigner?.depositAtMaturity(
        parseInt(date.value),
        ethers.utils.parseUnits(1!.toString()),
        ethers.utils.parseUnits(1!.toString()),
        address
      );

      handleTx({ status: 'processing', hash: tx?.hash });

      const status = await tx.wait();

      handleTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      console.log(e);
    }
  }

  async function approve() {
    try {
      const approval = await underlyingContract?.approve(
        contractAddress,
        ethers.utils.parseUnits(numbers.approvalAmount!.toString())
      );

      //we set the transaction as pending
      setPending((pending) => !pending);

      await approval.wait();

      //we set the transaction as done
      setPending((pending) => !pending);

      //once the tx is done we update the step
      setStep((step) => step + 1);
    } catch (e) {
      console.log(e);
    }
  }

  function handleLoading(hasRate: boolean) {
    handleResult({ potentialRate: undefined, hasRate: hasRate });
  }

  function handleClickAction() {
    if (step === 1 && !pending) {
      return approve();
    } else if (!pending) {
      return deposit();
    }
  }

  async function getMaxAmount() {
    const balance = await underlyingContract?.balanceOf(address);

    const max = balance && ethers.utils.formatEther(balance);

    if (max) {
      setQty(max);
      setError({ status: false, msg: '' });
    }
  }

  return (
    <>
      <div className={style.fieldContainer}>
        <span>{translations[lang].depositTitle}</span>
        <div className={style.inputContainer}>
          <Input
            type="number"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQty(e.target.valueAsNumber);
              setError({ status: false, msg: '' });
            }}
            value={qty}
            placeholder="0"
          />
          <span className={style.maxButton} onClick={getMaxAmount}>
            MAX
          </span>
        </div>
        {gas && (
          <p className={style.txCost}>
            <span>{translations[lang].txCost}</span>
            <span>
              {gas.eth} ETH / {gas.gwei} GWEI
            </span>
          </p>
        )}
      </div>
      <div className={style.fieldContainer}>
        <div className={style.titleContainer}>
          <span>{translations[lang].endDate}</span>
          <Tooltip value={translations[lang].endDate} />
        </div>
        <div className={style.inputContainer}>
          <MaturitySelector address={address} />
        </div>
      </div>
      {error?.status && <p className={style.error}>{error?.msg}</p>}
      <Stepper currentStep={step} totalSteps={3} />
      <div className={style.fieldContainer}>
        {!pending && (
          <p>
            {step == 1
              ? translations[lang].permissionApprove
              : translations[lang].permissionDeposit}
          </p>
        )}
        {pending && <p>{translations[lang].pendingTransaction}</p>}
        <div className={style.buttonContainer}>
          <Button
            text={step == 1 ? translations[lang].approve : translations[lang].deposit}
            onClick={handleClickAction}
            className={qty && qty > 0 && !pending ? 'primary' : 'disabled'}
            disabled={(!qty || qty <= 0) && !pending}
          />
        </div>
      </div>
    </>
  );
}

export default SupplyForm;
