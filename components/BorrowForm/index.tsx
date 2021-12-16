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
import FixedLenderContext from 'contexts/FixedLenderContext';
import InterestRateModelContext from 'contexts/InterestRateModelContext';
import { Market } from 'types/Market';

type Props = {
  contractWithSigner: ethers.Contract;
  handleResult: (data: SupplyRate | undefined) => void;
  hasRate: boolean;
  address: string;
  assetData: Market | undefined;
};

function BorrowForm({
  contractWithSigner,
  handleResult,
  hasRate,
  address,
  assetData
}: Props) {

  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);
  const interestRateModel = useContext(InterestRateModelContext);

  const [qty, setQty] = useState<number>(0);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const daiContract = useContractWithSigner(
    '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    daiAbi
  );


  const interestRateModelContract = useContract(
    interestRateModel.address!,
    interestRateModel.abi!
  );
  const fixedLenderWithSigner = useContractWithSigner(address, fixedLender?.abi!);

  useEffect(() => {
    calculateRate();
  }, [qty, date]);

  async function calculateRate() {
    if (!qty || !date) {
      return setError({ status: true, msg: dictionary.amountError });
    }

    const maturityPools =
      await fixedLenderWithSigner?.contractWithSigner?.maturityPools(
        parseInt(date.value)
      );

    const smartPool = await fixedLenderWithSigner?.contractWithSigner?.smartPool();
    //Borrow
    try {
      const borrowRate =
        await interestRateModelContract?.contract?.getRateToBorrow(
          parseInt(date.value),
          maturityPools,
          smartPool,
          false
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

    if (!qty || !date) {
      return setError({ status: true, msg: dictionary.defaultError });
    }

    await fixedLenderWithSigner?.contractWithSigner?.borrowFromMaturityPool(
      ethers.utils.parseUnits(qty!.toString()),
      parseInt(date.value),
      ethers.utils.parseUnits("1000")
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
              setQty(e.target.valueAsNumber);
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
            text={dictionary.borrow}
            onClick={borrow}
            className={qty > 0 ? 'secondary' : 'disabled'}
            disabled={qty <= 0}
          />
        </div>
      </div>
    </>
  );
}

export default BorrowForm;
