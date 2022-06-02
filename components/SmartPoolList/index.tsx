import { useContext } from 'react';

import Item from './Item';

import { Market } from 'types/Market';
import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';

import styles from './style.module.scss';

import keys from './translations.json';
import Tooltip from 'components/Tooltip';

type Props = {
  markets: Array<Market>;
  showModal: (marketData: Market, type: String) => void;
};

function SmartPoolList({ markets, showModal }: Props) {
  const fixedLenderData = useContext(FixedLenderContext);
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
            <span className={styles.title}>{translations[lang].annualRate}</span>
            <span className={styles.title} />
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} showModal={showModal} />;
          })}
          {markets.length === 0 &&
            fixedLenderData.map((_, key) => {
              return <Item key={key} market={undefined} />;
            })}
        </div>
      </div>
    </section>
  );
}

export default SmartPoolList;
