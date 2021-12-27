import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';

import style from './style.module.scss';
import Input from 'components/common/Input';
import Button from 'components/common/Button';
import MaturitySelector from 'components/MaturitySelector';
import Loading from 'components/common/Loading';

import useContractWithSigner from 'hooks/useContractWithSigner';
import useContract from 'hooks/useContract';

import daiAbi from 'contracts/abi/dai.json';
import underlyings from 'data/underlying.json';

import { SupplyRate } from 'types/SupplyRate';
import { Error } from 'types/Error';

import dictionary from 'dictionary/en.json';

import { AddressContext } from 'contexts/AddressContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import InterestRateModelContext from 'contexts/InterestRateModelContext';
import { AlertContext } from 'contexts/AlertContext';

type Props = {
  contractWithSigner: ethers.Contract;
  handleResult: (data: SupplyRate | undefined) => void;
  hasRate: boolean | undefined;
  address: string;
};

function SupplyForm({
  contractWithSigner,
  handleResult,
  hasRate,
  address
}: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);
  const interestRateModel = useContext(InterestRateModelContext);
  const { setAlert } = useContext(AlertContext);
  const [qty, setQty] = useState<number | undefined>(undefined);

  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ''
  });

  const [loading, setLoading] = useState<Boolean>(false);

  const daiContract = useContractWithSigner(
    '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    daiAbi
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
      return setError({ status: true, msg: dictionary.amountError });
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
      return setError({ status: true, msg: dictionary.defaultError });
    }
  }

  async function deposit() {
    if (!qty || !date) {
      return setError({ status: true, msg: dictionary.defaultError });
    }

    try {
      setLoading(true);
      const approval = await daiContract?.contractWithSigner?.approve(
        address,
        ethers.utils.parseUnits(qty!.toString())
      );

      const txApproval = await approval.wait();

      setLoading(false);
      setAlert({
        type: 'success',
        code: dictionary.success,
        tx: txApproval?.from
      });

      const tx =
        await fixedLenderWithSigner?.contractWithSigner?.depositToMaturityPool(
          ethers.utils.parseUnits(qty!.toString()),
          parseInt(date.value),
          '0'
        );
      console.log(tx, 1234); //this shows de tx hash

      //this notifies us when the transaction is completed
      //there is a property called status that returns a number, have to figure out it's values

      const txDetails = await tx.wait();

      setAlert({
        type: 'success',
        code: dictionary.success,
        tx: txDetails?.from
      });
    } catch (e: any) {
      setLoading(false);
      setAlert({
        type: 'error',
        code: e?.code ?? dictionary.defaultError
      });
    }
  }

  function handleLoading(hasRate: boolean) {
    handleResult({ potentialRate: undefined, hasRate: hasRate });
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
            placeholder="0"
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
      {!loading ? (
        <div className={style.fieldContainer}>
          <div className={style.buttonContainer}>
            <Button
              text={dictionary.deposit}
              onClick={deposit}
              className={qty && qty > 0 ? 'primary' : 'disabled'}
              disabled={!qty || qty <= 0}
            />
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
}

export default SupplyForm;
