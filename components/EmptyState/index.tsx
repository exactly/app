import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import sytles from './style.module.scss';

function EmptyState() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  return (
    <section className={sytles.container}>
      <h3 className={sytles.title}>{translations[lang].emptyState}</h3>
      <h4 className={sytles.description}>{translations[lang].position}</h4>
    </section>
  );
}

export default EmptyState;
