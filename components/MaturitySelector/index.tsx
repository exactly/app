import { useState } from "react";

import Select from "components/common/Select";

import useContract from "hooks/useContract";

import { getContractsByEnv } from "utils/utils";

import style from "./style.module.scss";

type Props = {};

function MaturitySelector({}: Props) {
  const [dates, setDates] = useState<Array<string>>([]);
  const { auditor } = getContractsByEnv();
  const auditorContract = useContract(auditor.address, auditor.abi);

  async function getPools() {
    const pools = await auditorContract?.contract?.getFuturePools();
    const dates = pools?.map((pool: any) => {
      return pool.toString();
    });

    setDates(dates ?? []);
  }

  return (
    <section className={style.container}>
      <p className={style.title}>Maturity Pools</p>
      <Select options={dates} onClick={getPools} />
    </section>
  );
}

export default MaturitySelector;
