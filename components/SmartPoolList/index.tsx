import { useEffect } from 'react';

import styles from './style.module.scss';

import Item from './Item';
import Loading from 'components/common/Loading';

import dictionary from 'dictionary/en.json';
import assets from 'dictionary/assets.json';

import { Market } from 'types/Market';
import { Assets } from 'types/Assets';

type Props = {
  markets: Array<Market>;
  showModal: (address: Market['address'], type: 'smartDeposit') => void;
};

function SmartPoolList({ markets, showModal }: Props) {
  return (
    <section className={styles.container}>
      <p className={styles.sectionTitle}>Smart Pool</p>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{dictionary.asset}</span>
            <span className={styles.title}>{dictionary.marketSize}</span>
            <span className={styles.title} />
          </div>
          {markets?.map((market, key) => {
            const symbol: keyof Market = market.symbol;
            const assetsData: Assets<symbol> = assets;
            const src: string = assetsData[symbol];

            return (
              <Item market={market} key={key} showModal={showModal} src={src} />
            );
          })}
          {markets.length === 0 && <Loading />}
        </div>
      </div>
    </section>
  );
}

export default SmartPoolList;
