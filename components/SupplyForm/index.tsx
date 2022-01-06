import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';

import style from './style.module.scss';
import Input from 'components/common/Input';
import Button from 'components/common/Button';
import MaturitySelector from 'components/MaturitySelector';
import Stepper from 'components/Stepper';

import useContractWithSigner from 'hooks/useContractWithSigner';
import useContract from 'hooks/useContract';

import { SupplyRate } from 'types/SupplyRate';
import { Error } from 'types/Error';

import { getUnderlyingData } from 'utils/utils';

import { AddressContext } from 'contexts/AddressContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import InterestRateModelContext from 'contexts/InterestRateModelContext';
import LangContext from 'contexts/LangContext';

import { Market } from 'types/Market';
import { UnderlyingData } from 'types/Underlying';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';

import keys from './translations.json';

type Props = {
  contractWithSigner: ethers.Contract;
  handleResult: (data: SupplyRate | undefined) => void;
  hasRate: boolean | undefined;
  address: string;
  assetData: Market | undefined;
  handleTx: (data: Transaction) => void;
};

function SupplyForm({
  contractWithSigner,
  handleResult,
  hasRate,
  address,
  assetData,
  handleTx
}: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);
  const interestRateModel = useContext(InterestRateModelContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [qty, setQty] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const [step, setStep] = useState<number>(1);
  const [pending, setPending] = useState<boolean>(false);

  let underlyingData: UnderlyingData | undefined = undefined;

  if (assetData?.symbol) {
    underlyingData = getUnderlyingData(
      process.env.NEXT_PUBLIC_NETWORK!,
      assetData.symbol
    );
  }

  const underlyingContract = useContractWithSigner(
    underlyingData!.address,
    underlyingData!.abi
  );

  const interestRateModelContract = useContract(
    interestRateModel.address!,
    interestRateModel.abi!
  );
  const fixedLenderWithSigner = useContractWithSigner(
    address,
    fixedLender?.abi!
  );

  useEffect(() => {
    calculateRate();
  }, [qty, date]);

  async function calculateRate() {
    if (!qty || !date) {
      handleLoading(true);
      return setError({ status: true, msg: translations[lang].amountError });
    }

    handleLoading(false);

    const maturityPools =
      await fixedLenderWithSigner?.contractWithSigner?.maturityPools(
        parseInt(date.value)
      );

    //Supply
    try {
      const supplyRate =
        await interestRateModelContract?.contract?.getRateToSupply(
          parseInt(date.value),
          maturityPools
        );

      const formattedRate = supplyRate && ethers.utils.formatEther(supplyRate);
      formattedRate &&
        handleResult({ potentialRate: formattedRate, hasRate: true });
    } catch (e) {
      return setError({ status: true, msg: translations[lang].error });
    }
  }

  async function deposit() {
    if (!qty || !date) {
      return setError({ status: true, msg: translations[lang].error });
    }

    const tx =
      await fixedLenderWithSigner?.contractWithSigner?.depositToMaturityPool(
        ethers.utils.parseUnits(qty!.toString()),
        parseInt(date.value),
        '0'
      );

    handleTx({ status: 'processing', hash: tx?.hash });

    const status = await tx.wait();

    handleTx({ status: 'success', hash: status?.transactionHash });
  }

  async function approve() {
    const approval = await underlyingContract?.contractWithSigner?.approve(
      address,
      ethers.utils.parseUnits(99999999999999999999!.toString())
    );

    //we set the transaction as pending
    setPending((pending) => !pending);

    await approval.wait();

    //we set the transaction as done
    setPending((pending) => !pending);

    //once the tx is done we update the step
    setStep((step) => step + 1);
  }

  function handleLoading(hasRate: boolean) {
    handleResult({ potentialRate: undefined, hasRate: hasRate });
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
        </div>
      </div>
      <div className={style.fieldContainer}>
        <span>{translations[lang].maturityPool}</span>
        <div className={style.inputContainer}>
          <MaturitySelector />
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
            text={translations[lang].deposit}
            onClick={
              step == 1 && !pending ? approve : !pending ? deposit : () => {}
            }
            className={qty && qty > 0 ? 'primary' : 'disabled'}
            disabled={!qty || qty <= 0}
          />
        </div>
      </div>
    </>
  );
}

export default SupplyForm;
