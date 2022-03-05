import { useContext } from 'react';

import Title from 'components/Title';
import Circle from './Circle';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

function HowItWorks() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const bullets = [
    {
      title: translations[lang].titleDepositVariable,
      description: translations[lang].descriptionDepositVariable,
      icon: '/img/icons/depositVariable.svg'
    },
    {
      title: translations[lang].titleDepositFixed,
      description: translations[lang].descriptionDepositFixed,
      icon: '/img/icons/depositFixed.svg'
    },
    {
      title: translations[lang].titleBorrow,
      description: translations[lang].descriptionBorrow,
      icon: '/img/icons/borrow.svg',
      type: 'secondary'
    }
  ];

  return (
    <section>
      <Title
        title={translations[lang].howItWorks}
        subtitle={translations[lang].howItWorksSubtitle}
      />
      <div className={styles.circlesContainer}>
        {bullets.map((bullet, key) => {
          return (
            <Circle
              key={key}
              title={bullet.title}
              description={bullet.description}
              icon={bullet.icon}
              type={bullet?.type}
            />
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;
