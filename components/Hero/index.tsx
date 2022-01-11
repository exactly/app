import { useContext } from 'react';

import AssetSelector from 'components/AssetSelector';
import PoolsChart from 'components/PoolsChart';
import SpecialText from 'components/SpecialText';

import LangContext from 'contexts/LangContext';

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
          <SpecialText />
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
