import React, { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import styles from './style.module.scss';

type Props = {
  connected?: boolean;
  tab?: string;
};

function EmptyState({ connected, tab }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.container}>
      {connected && tab ? (
        <>
          <h3 className={styles.title}>{translations[lang][tab]}</h3>
        </>
      ) : (
        <>
          <h3 className={styles.title}>{translations[lang].position}</h3>
        </>
      )}
    </section>
  );
}

export default EmptyState;
