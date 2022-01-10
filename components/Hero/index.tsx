import { useContext, useEffect, useState } from 'react';

import AssetSelector from 'components/AssetSelector';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import style from './style.module.scss';

import keys from './translations.json';
import PoolsChart from 'components/PoolsChart';

const Hero = () => {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [status, setStatus] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((status) => !status);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className={style.container}>
        <div className={style.right}>
          <h1 className={style.title}>
            <span className={style.bolder}>DeFi</span>xed <br /> Income
          </h1>
          <p className={style.subtitle}>{translations[lang].description}</p>
          <div className={style.specialText}>
            <p className={style.first}>
              <span
                className={`${status ? style.blue : style.green} ${
                  style.space
                }`}
              >
                {status ? 'Borrow' : 'Lend'}
              </span>{' '}
              <span className={style.text}>knowing Exactly how</span>
            </p>{' '}
            <p className={style.second}>
              <span className={style.text}>much you are gonna </span>
              <span
                className={`${status ? style.blue : style.green} ${
                  style.space
                }`}
              >
                {status ? 'pay' : 'earn'}
              </span>
            </p>
          </div>
        </div>
        <div className={style.left}>
          <AssetSelector />
          <PoolsChart />
        </div>
      </section>
    </>
  );
};

export default Hero;
