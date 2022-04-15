import { useContext } from 'react';

import Item from './Item';
import Loading from 'components/common/Loading';

import assets from 'dictionary/assets.json';

import { Market } from 'types/Market';
import { Assets } from 'types/Assets';
import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';
import Tooltip from 'components/Tooltip';

type Props = {
  markets: Array<Market>;
  showModal: (marketData: Market, type: String) => void;
};

function SmartPoolList({ markets, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.container}>
      <div className={styles.sectionTitleContainer}>
        <p className={styles.sectionTitle}>{translations[lang].smartPool}</p>
        <Tooltip value={translations[lang].smartPool} />
      </div>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>{translations[lang].marketSize}</span>
            <span className={styles.title} />
          </div>
          {markets?.map((market, key) => {
            const symbol: keyof Market = market.symbol;
            const assetsData: Assets<symbol> = assets;
            const src: string = assetsData[symbol];

            return <Item market={market} key={key} showModal={showModal} src={src} />;
          })}
          {markets.length === 0 && <Loading />}
        </div>
      </div>
    </section>
  );
}

export default SmartPoolList;
