import { useContext } from 'react';
import Skeleton from 'react-loading-skeleton';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  currentStep: number | undefined;
  totalSteps: number;
};

function ModalStepper({ currentStep, totalSteps }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      <div className={styles.steps}>
        {(currentStep &&
          Array.from(Array(totalSteps).keys()).map((step) => {
            return (
              <div
                className={currentStep >= step + 1 ? styles.selectedStep : styles.step}
                key={step}
              ></div>
            );
          })) || <Skeleton containerClassName={styles.skeleton} />}
        {currentStep == 1 && <p className={styles.text}>{translations[lang].approval}</p>}
      </div>
    </>
  );
}

export default ModalStepper;
