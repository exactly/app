import { useContext } from 'react';
import Link from 'next/link';

import LangContext from 'contexts/LangContext';

import { Step } from 'types/Step';
import { LangKeys } from 'types/Lang';

import style from './style.module.scss';

import keys from './translations.json';

type Props = {
  steps: Array<Step>;
};
function Breadcrumb({ steps }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <ul className={style.container}>
      <Link href="/">
        <li>translations[lang].markets</li>
      </Link>

      {steps.map((step: Step, key) => {
        return (
          <Link href={step.url} key={key}>
            <li>{step.value}</li>
          </Link>
        );
      })}
    </ul>
  );
}

export default Breadcrumb;
