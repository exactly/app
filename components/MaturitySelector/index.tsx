import { useContext } from 'react';
import Skeleton from 'react-loading-skeleton';

import Select from 'components/common/Select';

import style from './style.module.scss';

import { AddressContext } from 'contexts/AddressContext';

import { Date } from 'types/Date';

type Props = {
  title?: string;
  subtitle?: string;
  editable?: boolean;
};

function MaturitySelector({ title, subtitle, editable }: Props) {
  const { date, setDate, dates } = useContext(AddressContext);

  function handleChange(option: Date) {
    setDate(option);
  }

  const sectionContainerClass = editable ? 'sectionContainerEditable' : 'sectionContainer';

  return (
    <section className={style[sectionContainerClass]}>
      {title && (
        <div className={style.titleContainer}>
          <p className={style.title}>{title}</p>
        </div>
      )}
      <div className={style.maturityContainer}>
        {subtitle && <p className={style.title}>{subtitle}</p>}
        {dates.length !== 0 ? (
          <Select
            options={dates}
            onChange={handleChange}
            placeholder={date?.value ?? dates[0]?.label}
            value={date?.label ?? dates[0]?.value}
            editable={editable}
          />
        ) : (
          <Skeleton width={140} height={48} />
        )}
      </div>
    </section>
  );
}

export default MaturitySelector;
