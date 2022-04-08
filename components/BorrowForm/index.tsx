import { useEffect, useState, useContext } from 'react';
import { Contract, ethers } from 'ethers';

import style from './style.module.scss';

import Input from 'components/common/Input';
import Button from 'components/common/Button';
import MaturitySelector from 'components/MaturitySelector';
import Tooltip from 'components/Tooltip';

import { SupplyRate } from 'types/SupplyRate';
import { Error } from 'types/Error';
import { LangKeys } from 'types/Lang';
import { Transaction } from 'types/Transaction';
import { Gas } from 'types/Gas';

import keys from './translations.json';

import { AddressContext } from 'contexts/AddressContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import InterestRateModelContext from 'contexts/InterestRateModelContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { getContractData } from 'utils/contracts';

type Props = {
  handleResult: (data: SupplyRate | undefined) => void;
  contractAddress: string;
  handleTx: (data: Transaction) => void;
};

function BorrowForm({ handleResult, contractAddress, handleTx }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { web3Provider, address } = useWeb3Context();

  const { date } = useContext(AddressContext);
  const interestRateModel = useContext(InterestRateModelContext);
  const fixedLenderData = useContext(FixedLenderContext);

  const [qty, setQty] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });
  const [gas, setGas] = useState<Gas | undefined>(undefined);

  const [fixedLenderWithSigner, setFixedLenderWithSigner] = useState<Contract | undefined>(
    undefined
  );

  const [interestRateModelContract, setInterestRateModelContract] = useState<Contract | undefined>(
    undefined
  );

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((fl) => fl.address == contractAddress);
    const fixedLenderWithSigner = await getContractData(
      contractAddress,
      filteredFixedLender?.abi!,
      web3Provider?.getSigner()
    );

    const interestRateModelContract = await getContractData(
      interestRateModel.address!,
      interestRateModel.abi!
    );

    setInterestRateModelContract(interestRateModelContract);

    setFixedLenderWithSigner(fixedLenderWithSigner);
  }

  useEffect(() => {
    getFixedLenderContract();
  }, []);

  useEffect(() => {
    if (fixedLenderWithSigner) {
      calculateRate();
    }
  }, [qty, date, fixedLenderWithSigner]);

  useEffect(() => {
    if (fixedLenderWithSigner && !gas) {
      estimateGas();
    }
  }, [fixedLenderWithSigner]);

  async function calculateRate() {
    if (!qty || !date) {
      handleLoading(true);
      return setError({ status: true, msg: translations[lang].amountError });
    }

    handleLoading(false);

    const smartPoolSupplied = await fixedLenderWithSigner?.smartPoolBalance();

    const maturityPoolStatus = await fixedLenderWithSigner?.maturityPools(parseInt(date.value));

    const currentTimestamp = Math.floor(Date.now() / 1000);

    //b 0 / s 1 / smS 202
    //
    //Borrow
    try {
      const borrowRate = await interestRateModelContract?.getRateToBorrow(
        parseInt(date.value),
        currentTimestamp,
        ethers.utils.parseUnits(qty!, 18),
        maturityPoolStatus.borrowed,
        maturityPoolStatus.supplied,
        smartPoolSupplied
      );

      const formattedBorrowRate = borrowRate && ethers.utils.formatEther(borrowRate);
      formattedBorrowRate && handleResult({ potentialRate: formattedBorrowRate, hasRate: true });
    } catch (error: any) {
      return setError({
        status: true,
        msg: translations[lang][error?.errorName?.toLowerCase()] ?? translations[lang].error
      });
    }
  }

  async function borrow() {
    if (!qty || !date) {
      return setError({ status: true, msg: translations[lang].error });
    }

    try {
      const tx = await fixedLenderWithSigner?.borrowAtMaturity(
        parseInt(date.value),
        ethers.utils.parseUnits(qty!.toString()),
        ethers.utils.parseUnits(qty!.toString()),
        address,
        address
      );

      handleTx({ status: 'processing', hash: tx?.hash });

      const status = await tx.wait();

      handleTx({ status: 'success', hash: status?.transactionHash });
    } catch (e) {
      console.log(e);
    }
  }

  function handleLoading(hasRate: boolean) {
    handleResult({ potentialRate: undefined, hasRate: hasRate });
  }

  async function estimateGas() {
    if (!date) return;

    const gasPriceInGwei = await fixedLenderWithSigner?.provider.getGasPrice();

    const estimatedGasCost = await fixedLenderWithSigner?.estimateGas.borrowAtMaturity(
      parseInt(date.value),
      ethers.utils.parseUnits(1!.toString()),
      ethers.utils.parseUnits(1!.toString()),
      address,
      address
    );

    if (gasPriceInGwei && estimatedGasCost) {
      const gwei = await ethers.utils.formatUnits(gasPriceInGwei, 'gwei');
      const gasCost = await ethers.utils.formatUnits(estimatedGasCost, 'gwei');
      const eth = parseFloat(gwei) * parseFloat(gasCost);

      setGas({ eth: eth.toFixed(8), gwei: parseFloat(gwei).toFixed(1) });
    }
  }

  return (
    <>
      <div className={style.fieldContainer}>
        <span>{translations[lang].borrowTitle}</span>
        <div className={style.inputContainer}>
          <Input
            type="number"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQty(e.target.value);
              setError({ status: false, msg: '' });
            }}
            value={qty}
            placeholder="0"
          />
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
          <MaturitySelector address={contractAddress} />
        </div>
      </div>
      {error?.status && <p className={style.error}>{error?.msg}</p>}
      <div className={style.fieldContainer}>
        <div className={style.buttonContainer}>
          <Button
            text={translations[lang].borrow}
            onClick={borrow}
            className={qty && parseFloat(qty) > 0 ? 'secondary' : 'disabled'}
            disabled={!qty || parseFloat(qty) <= 0}
          />
        </div>
      </div>
    </>
  );
}

export default BorrowForm;
