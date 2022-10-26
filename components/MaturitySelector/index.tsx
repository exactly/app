import { useCallback, useContext } from 'react';
import Skeleton from 'react-loading-skeleton';
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('components/common/Select'));

import style from './style.module.scss';

import { MarketContext } from 'contexts/MarketContext';

type Props = {
  title?: string;
  subtitle?: string;
};

function MaturitySelector({ title, subtitle }: Props) {
  const { date, setDate, dates } = useContext(MarketContext);

  return (
    <section className={style.sectionContainerEditable}>
      {title && (
        <div className={style.titleContainer}>
          <p className={style.title}>{title}</p>
        </div>
      )}
      <div className={style.maturityContainer}>
        {subtitle && <p className={style.title}>{subtitle}</p>}
        {dates.length ? (
          <Select
            options={dates}
            onChange={useCallback(
              (option) => {
                setDate(option);
              },
              [setDate],
            )}
            placeholder={date?.value}
            value={date?.label}
            editable
          />
        ) : (
          <Skeleton width={140} height={48} />
        )}
      </div>
    </section>
  );
}

export default MaturitySelector;
