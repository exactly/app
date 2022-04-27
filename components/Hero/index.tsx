import { useContext } from 'react';
import Link from 'next/link';

import LangContext from 'contexts/LangContext';

import Button from 'components/common/Button';

import { LangKeys } from 'types/Lang';

import style from './style.module.scss';

import keys from './translations.json';

const Hero = () => {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      <section className={style.container}>
        <div className={style.right}>
          <h1 className={style.title}>
            <span className={style.bolder}>DeFi</span>xed <br /> Income
          </h1>
          <p className={style.subtitle}>{translations[lang].description}</p>
          <div className={style.buttonContainer}>
            <Link href="/pools">
              <Button text={translations[lang].open} />
            </Link>
          </div>
        </div>
        <div className={style.left}>
          <img src="/img/graphs/assets.svg" alt="assets" className={style.image} />
        </div>
      </section>
    </>
  );
};

export default Hero;
