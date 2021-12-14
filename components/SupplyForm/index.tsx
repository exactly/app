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

function SupplyForm({
  contractWithSigner,
  handleResult,
  hasRate,
  address
}: Props) {
  const { date } = useContext(AddressContext);

  const [qty, setQty] = useState<number>(0);

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
    if (!qty || !date) {
      return setError({ status: true, msg: dictionary.amountError });
    }

    const maturityPools =
      await exafinWithSigner?.contractWithSigner?.maturityPools(
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
      formattedRate && handleResult({ potentialRate: formattedRate });
    } catch (e) {
      return setError({ status: true, msg: dictionary.defaultError });
    }
  }

  async function deposit() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    const from = await provider.getSigner().getAddress();

    if (!qty || !date) {
      return setError({ status: true, msg: dictionary.defaultError });
    }

    await daiContract?.contractWithSigner?.approve(
      '0xCa2Be8268A03961F40E29ACE9aa7f0c2503427Ae',
      ethers.utils.parseUnits(qty!.toString())
    );

    const depositTx =
      await exafinWithSigner?.contractWithSigner?.depositToMaturityPool(
        ethers.utils.parseUnits(qty!.toString()),
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
            text={dictionary.deposit}
            onClick={deposit}
            className={qty > 0 ? 'primary' : 'disabled'}
            disabled={qty <= 0}
          />
        </div>
      </div>
    </>
  );
}

export default SupplyForm;
