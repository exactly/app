import { useEffect, useState, useContext } from 'react';
import { Option } from 'react-dropdown';
import dayjs from 'dayjs';

import Select from 'components/common/Select';
import Tooltip from 'components/Tooltip';

import style from './style.module.scss';

import { AddressContext } from 'contexts/AddressContext';
import FixedLenderContext from 'contexts/FixedLenderContext';

import { Date } from 'types/Date';

import parseTimeStamp from 'utils/parseTimestamp';
import { getContractData } from 'utils/contracts';

type Props = {
  title?: string;
  address?: string;
};

function MaturitySelector({ title, address }: Props) {
  const { date, setDate } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);

  const [dates, setDates] = useState<Array<Option>>([]);

  //Kinda hacky but all the fixedLender will have the same futurePools for Exactly V1
  const filteredFixedLender = fixedLender.find((fl) => fl.address == address);

  const fixedLenderAddress = filteredFixedLender
    ? filteredFixedLender.address!
    : fixedLender[0].address!;

  const fixedLenderABI = filteredFixedLender ? filteredFixedLender.abi! : fixedLender[0].abi!;

  const fixedLenderContract = getContractData(fixedLenderAddress, fixedLenderABI);

  useEffect(() => {
    if (dates.length == 0) {
      getPools();
    }
  }, [fixedLenderContract, dates]);

  async function getPools() {
    const currentTimestamp = dayjs().unix();
    const interval = 604800;
    let timestamp = currentTimestamp - (currentTimestamp % interval);
    const maxPools = await fixedLenderContract?.maxFuturePools();
    const pools = [];

    for (let i = 0; i < maxPools; i++) {
      timestamp += interval;
      pools.push(timestamp);
    }

    const dates = pools?.map((pool: any) => {
      return pool.toString();
    });

    const formattedDates = dates?.map((date: any) => {
      return {
        value: date,
        label: parseTimeStamp(date)
      };
    });
    setDates(formattedDates ?? []);
    !date && formattedDates && setDate(formattedDates[0]);
  }

  function handleChange(option: Date) {
    setDate(option);
  }

  return (
    <section className={style.sectionContainer}>
      {title && (
        <div className={style.titleContainer}>
          <p className={style.title}>{title}</p>
          <Tooltip value={title} />
        </div>
      )}
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
