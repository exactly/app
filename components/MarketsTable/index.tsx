import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import FixedTable from './FixedTable';
import VariableTable from './VariableTable';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import styles from './style.module.scss';

function MarketsTable() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.tablesContainer}>
      <section className={styles.tableContainer}>
        <h4 className={styles.title}>{translations[lang].variableRatePools}</h4>
        <VariableTable />
      </section>
      <section className={styles.tableContainer}>
        <h4 className={styles.title}>{translations[lang].fixedRatePools}</h4>
        <FixedTable />
      </section>
    </section>
  );
}

export default MarketsTable;
