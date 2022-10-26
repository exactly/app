import { useContext } from 'react';
import { Option } from 'react-dropdown';
import styles from './style.module.scss';
import keys from './translations.json';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

type Props = {
  values: Array<Option>;
  handleTab: (value: Option) => void;
  selected: Option;
};

function Tabs({ values, selected, handleTab }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.tabsSection}>
      <div className={styles.tabs}>
        {values.map((value) => {
          return (
            <p
              className={value.value === selected.value ? `${styles.tab} ${styles.selected}` : styles.tab}
              onClick={() => handleTab(value)}
              key={value.value}
            >
              {translations[lang][`${value.label}`]}
            </p>
          );
        })}
      </div>
    </section>
  );
}

export default Tabs;
