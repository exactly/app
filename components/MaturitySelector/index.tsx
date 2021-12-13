import { useEffect, useState, useContext } from 'react';
import dayjs from 'dayjs';
import { Option } from 'react-dropdown';

import Select from 'components/common/Select';

import useContract from 'hooks/useContract';

import { getContractsByEnv } from 'utils/utils';

import style from './style.module.scss';

import { AddressContext } from 'contexts/AddressContext';

type Props = {
  title?: String;
};

function MaturitySelector({ title }: Props) {
  const { date, setDate } = useContext(AddressContext);

  const [dates, setDates] = useState<Array<Option>>([]);
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
    !date && formattedDates && setDate(formattedDates[0]);
  }

  function handleChange(option: Option) {
    setDate(option);
  }

  useEffect(() => {
    if (dates.length == 0) {
      getPools();
    }
  }, [auditorContract]);

  return (
    <section className={style.container}>
      {title && <p className={style.title}>{title}</p>}
      <Select
        options={dates}
        onChange={handleChange}
        placeholder={date?.value ?? dates[0]?.label}
        value={date?.label ?? dates[0]?.value}
      />
    </section>
  );
}

export default MaturitySelector;
