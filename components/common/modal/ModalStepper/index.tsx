import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  currentStep: Number;
  totalSteps: Number;
};

function ModalStepper({ currentStep, totalSteps }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      <div className={styles.steps}>
        {Array.from(Array(totalSteps).keys()).map((step) => {
          return (
            <div
              className={currentStep >= step + 1 ? styles.selectedStep : styles.step}
              key={step}
            ></div>
          );
        })}
      </div>
      {currentStep == 1 && <p className={styles.text}>{translations[lang].approval}</p>}
      {currentStep == 2 && (
        <p className={styles.text}>
          {translations[lang].deposit} <strong>{translations[lang].collateral}</strong>
        </p>
      )}
    </>
  );
}

export default ModalStepper;
