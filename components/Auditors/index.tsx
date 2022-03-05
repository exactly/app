import { useContext } from 'react';

import Title from 'components/Title';

import styles from './style.module.scss';

import auditors from './auditors.json';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

function Auditors() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.container}>
      <Title title={translations[lang].auditors} subtitle={translations[lang].auditorsSubtitle} />
      <div className={styles.imagesContainer}>
        {auditors.map((auditor) => {
          return (
            <a href={auditor.web} target="_blank" rel="noopener noreferrer">
              <img src={`/img/auditors/${auditor.name}.svg`} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default Auditors;
