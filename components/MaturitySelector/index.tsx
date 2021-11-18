import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import Select from 'components/common/Select';

import useContract from 'hooks/useContract';

import { getContractsByEnv } from 'utils/utils';

import style from './style.module.scss';

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

    const formattedDates = dates?.map((date: any) => {
      return {
        value: date,
        label: dayjs.unix(parseInt(date)).format('DD-MMM-YY')
      };
    });

    setDates(formattedDates ?? []);
  }

  function handleChange(option: any) {
    console.log(option, 2134);
  }

  useEffect(() => {
    if (dates.length == 0) {
      getPools();
    }
  }, [auditorContract]);

  return (
    <section className={style.container}>
      <p className={style.title}>Maturity Pools</p>
      <Select
        options={dates}
        onChange={handleChange}
        placeholder={dates[0]?.label}
        value={dates[0]?.value}
      />
    </section>
  );
}

export default MaturitySelector;
