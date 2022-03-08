import { useContext } from 'react';

import Title from 'components/Title';

import styles from './style.module.scss';

import investors from './investors.json';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

function Investors() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.container}>
      <Title title={translations[lang].investors} subtitle={translations[lang].investorsSubtitle} />
      <div className={styles.imagesContainer}>
        {investors.map((investor, key) => {
          return (
            <a href={investor.web} target="_blank" rel="noopener noreferrer" key={key}>
              <img src={`/img/investors/${investor.name}.svg`} alt={investor.name} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default Investors;
