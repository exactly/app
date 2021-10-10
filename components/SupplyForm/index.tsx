import { useEffect, useState } from "react";
import { ethers } from "ethers";
import dayjs from "dayjs";

import style from "./style.module.scss";
import Input from "components/common/Input";
import Button from "components/common/Button";

import useContractWithSigner from "hooks/useContractWithSigner";
import daiAbi from "contracts/abi/dai.json";

import { SupplyRate } from "types/SupplyRate";
import { Error } from "types/Error";

import dictionary from "../../dictionary/en.json";
import Select from "components/common/Select";

type Props = {
  contractWithSigner: ethers.Contract;
  handleResult: (data: SupplyRate) => void;
  hasRate: boolean;
};

function SupplyForm({ contractWithSigner, handleResult, hasRate }: Props) {
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
  const [dates, setDates] = useState<Array<number>>([]);

  function handleDate(e: React.ChangeEvent<HTMLInputElement>) {
    setDueDate(parseInt(e.target.value));
    setError({ status: false, msg: "" });
  }

  useEffect(() => {
    getPools();
  }, []);

  useEffect(() => {
    calculateRate();
  }, [dueDate, qty]);

  async function calculateRate() {
    if (!qty) {
      setError({ status: true, msg: "Ingrese una Cantidad" });
      return;
    }

    if (!dueDate) {
      setError({ status: true, msg: "Ingrese una fecha" });
      return;
    }

    const rateForSupply = await contractWithSigner?.rateForSupply(
      ethers.utils.parseUnits(qty!),
      dueDate
    );

    const potentialRate = ethers.utils.formatEther(rateForSupply[0]);
    const poolSupply = ethers.utils.formatEther(rateForSupply[1][1]);
    const poolLend = ethers.utils.formatEther(rateForSupply[1][0]);

    handleResult({ potentialRate, poolSupply, poolLend });
  }

  async function deposit() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const from = await provider.getSigner().getAddress();

    await daiContract?.contractWithSigner?.approve(
      "0xCa2Be8268A03961F40E29ACE9aa7f0c2503427Ae",
      ethers.utils.parseUnits(qty!)
    );

    const depositTx = await contractWithSigner?.supply(
      from,
      ethers.utils.parseUnits(qty!),
      dueDate
    );
  }

  async function getPools() {
    const datesArray = await generateDates();
    setDates(datesArray);
  }

  function generateDates() {
    const timestamp = dayjs().unix();
    const trimmedCycle = timestamp - (timestamp % 1209600);
    let lastCheck = dayjs.unix(trimmedCycle).add(14, "days");

    const dateList = [];

    for (let i = 0; i < 5; i++) {
      dateList.push(dayjs(lastCheck).unix());
      lastCheck = dayjs(lastCheck).add(14, "days");
    }

    return dateList;
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
          <Select options={dates} onChange={handleDate} />
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
