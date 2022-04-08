import { useContext } from 'react';

import Title from 'components/Title';
import Circle from './Circle';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';
import Button from 'components/common/Button';

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
    <section className={styles.howItWorks}>
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
      <div className={styles.buttonContainer}>
        <Button text={translations[lang].openApp} />
        <a href="" target="_blank" rel="noopener noreferrer" className={styles.faq}>
          <img src="./img/icons/question.svg" />
          <p>{translations[lang].faq}</p>
        </a>
      </div>
    </section>
  );
}

export default HowItWorks;
