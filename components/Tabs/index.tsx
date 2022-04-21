import { Option } from 'react-dropdown';
import styles from './style.module.scss';

type Props = {
  values: Array<Option>;
  handleTab: (value: Option) => void;
  selected: Option;
};

function Tabs({ values, selected, handleTab }: Props) {
  return (
    <section className={styles.tabsSection}>
      <div className={styles.tabs}>
        {values.map((value) => {
          return (
            <p
              className={
                value.value === selected.value ? `${styles.tab} ${styles.selected}` : styles.tab
              }
              onClick={() => handleTab(value)}
              key={value.value}
            >
              {value.label}
            </p>
          );
        })}
      </div>
    </section>
  );
}

export default Tabs;
