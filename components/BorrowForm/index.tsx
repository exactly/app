import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';

import style from './style.module.scss';
import Input from 'components/common/Input';
import Button from 'components/common/Button';
import MaturitySelector from 'components/MaturitySelector';

import useContractWithSigner from 'hooks/useContractWithSigner';
import useContract from 'hooks/useContract';

import daiAbi from 'contracts/abi/dai.json';

import { SupplyRate } from 'types/SupplyRate';
import { Error } from 'types/Error';

import dictionary from 'dictionary/en.json';

import { getContractsByEnv } from 'utils/utils';

import { AddressContext } from 'contexts/AddressContext';

type Props = {
  contractWithSigner: ethers.Contract;
  handleResult: (data: SupplyRate | undefined) => void;
  hasRate: boolean;
  address: string;
};

function BorrowForm({
  contractWithSigner,
  handleResult,
  hasRate,
  address
}: Props) {
  const { date } = useContext(AddressContext);

  const [qty, setQty] = useState<string>('0');

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const daiContract = useContractWithSigner(
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    daiAbi
  );

  const { exafin, interestRateModel } = getContractsByEnv();

  const interestRateModelContract = useContract(
    interestRateModel.address,
    interestRateModel.abi
  );
  const exafinWithSigner = useContractWithSigner(exafin.address, exafin.abi);

  useEffect(() => {
    calculateRate();
  }, [qty, date]);

  async function calculateRate() {
    if (!qty) {
      return setError({ status: true, msg: dictionary.amountError });
    }

    const maturityPools =
      await exafinWithSigner?.contractWithSigner?.maturityPools(
        parseInt(date.value)
      );
    const smartPool = await exafinWithSigner?.contractWithSigner?.smartPool();

    //Borrow
    try {
      const borrowCondition: Boolean = qty > maturityPools.available;

      const borrowRate =
        await interestRateModelContract?.contract?.getRateToBorrow(
          parseInt(date.value),
          maturityPools,
          smartPool,
          borrowCondition
        );

      const formattedBorrowRate =
        borrowRate && ethers.utils.formatEther(borrowRate);

      formattedBorrowRate &&
        handleResult({ potentialRate: formattedBorrowRate });
    } catch (e) {
      return setError({ status: true, msg: dictionary.defaultError });
    }
  }

  async function borrow() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    const from = await provider.getSigner().getAddress();

    if (!qty) {
      return setError({ status: true, msg: dictionary.defaultError });
    }

    await daiContract?.contractWithSigner?.approve(
      '0xCa2Be8268A03961F40E29ACE9aa7f0c2503427Ae',
      ethers.utils.parseUnits(qty!)
    );

    const borrowTx = await exafinWithSigner?.contract?.borrow(
      from,
      ethers.utils.parseUnits(qty!),
      parseInt(date.value)
    );
  }

  return (
    <>
      <div className={style.fieldContainer}>
        <span>{dictionary.depositTitle}</span>
        <div className={style.inputContainer}>
          <Input
            type="number"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQty(e.target.value);
              setError({ status: false, msg: '' });
            }}
            value={qty}
          />
        </div>
      </div>
      <div className={style.fieldContainer}>
        <span>{dictionary.endDate}</span>
        <div className={style.inputContainer}>
          <MaturitySelector />
        </div>
      </div>
      {error?.status && <p className={style.error}>{error?.msg}</p>}
      <div className={style.fieldContainer}>
        <div className={style.buttonContainer}>
          <Button
            text={dictionary.deposit}
            onClick={borrow}
            className={parseFloat(qty) > 0 ? 'secondary' : 'disabled'}
            disabled={parseFloat(qty) <= 0}
          />
        </div>
      </div>
    </>
  );
}

export default BorrowForm;
