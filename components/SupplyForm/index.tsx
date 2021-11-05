import { cloneElement, useEffect, useState } from "react";
import { ethers } from "ethers";
import dayjs from "dayjs";

import style from "./style.module.scss";
import Input from "components/common/Input";
import Button from "components/common/Button";
import Select from "components/common/Select";

import useContractWithSigner from "hooks/useContractWithSigner";
import daiAbi from "contracts/abi/dai.json";

import { SupplyRate } from "types/SupplyRate";
import { Error } from "types/Error";

import dictionary from "../../dictionary/en.json";

import { getContractsByEnv } from "utils/utils";
import useContract from "hooks/useContract";

type Props = {
  contractWithSigner: ethers.Contract;
  handleResult: (data: SupplyRate) => void;
  hasRate: boolean;
  address: string;
};

function SupplyForm({
  contractWithSigner,
  handleResult,
  hasRate,
  address
}: Props) {
  const [qty, setQty] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>({
    status: false,
    msg: ""
  });

  const daiContract = useContractWithSigner(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    daiAbi
  );

  const { exafin, auditor } = getContractsByEnv();
  const exafinContract = useContract(exafin.address, exafin.abi);
  const exafinWithSigner = useContract(exafin.address, exafin.abi);
  const auditorContract = useContract(auditor.address, auditor.abi);
  const [dates, setDates] = useState<Array<string>>([]);

  function handleDate(e: React.ChangeEvent<HTMLInputElement>) {
    setDueDate(parseInt(e.target.value));
    setError({ status: false, msg: "" });
  }

  async function calculateRate() {
    if (!dueDate || !qty) {
      setError({ status: true, msg: "Error" });
    }

    try {
      const supplyRate = await exafinContract?.contract?.getRateToSupply(
        ethers.utils.parseUnits(qty!),
        dueDate
      );

      if (supplyRate) {
        const potentialRate = ethers.utils.formatEther(supplyRate);

        handleResult({ potentialRate });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function deposit() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const from = await provider.getSigner().getAddress();

    await daiContract?.contractWithSigner?.approve(
      "0xCa2Be8268A03961F40E29ACE9aa7f0c2503427Ae",
      ethers.utils.parseUnits(qty!)
    );

    const depositTx = await exafinWithSigner?.contract?.supply(
      from,
      ethers.utils.parseUnits(qty!),
      dueDate
    );
  }

  async function getPools() {
    const pools = await auditorContract?.contract?.getFuturePools();
    const dates = pools?.map((pool: any) => {
      return pool.toString();
    });

    setDates(dates ?? []);
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
              setError({ status: false, msg: "" });
            }}
          />
        </div>
      </div>
      <div className={style.fieldContainer}>
        <span>{dictionary.endDate}</span>
        <div className={style.inputContainer}>
          <Select options={dates} onChange={handleDate} onClick={getPools} />
        </div>
      </div>
      {error?.status && <p className={style.error}>{error?.msg}</p>}
      <div className={style.fieldContainer}>
        {hasRate ? (
          <div className={style.buttonContainer}>
            <Button text={dictionary.deposit} onClick={deposit} />
          </div>
        ) : (
          <div className={style.buttonContainer}>
            <Button text={dictionary.calculateRate} onClick={calculateRate} />
          </div>
        )}
      </div>
    </>
  );
}

export default SupplyForm;
