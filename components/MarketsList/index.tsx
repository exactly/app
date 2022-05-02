import { useContext } from 'react';

import Item from 'components/MarketsList/Item';
import Loading from 'components/common/Loading';

import assets from 'dictionary/assets.json';

import { Market } from 'types/Market';
import { Assets } from 'types/Assets';
import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

import style from './style.module.scss';

import keys from './translations.json';

type Props = {
  markets: Array<Market>;
  showModal: (marketData: Market, type: 'borrow' | 'deposit') => void;
};

function MarketsList({ markets, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={style.container}>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].marketSize}</span>
            <span className={style.title}>{translations[lang].lastFixedRate}</span>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            const symbol: keyof Market = market.symbol;
            const assetsData: Assets<symbol> = assets;
            const src: string = assetsData[symbol];

            return (
              <Item market={market} key={key} showModal={showModal} type="deposit" src={src} />
            );
          })}
          {markets.length === 0 && <Loading />}
        </div>
      </div>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].marketSize}</span>
            <span className={style.title}>{translations[lang].lastFixedRate}</span>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            const symbol: keyof Market = market.symbol;
            const assetsData: Assets<symbol> = assets;
            const src: string = assetsData[symbol];

            return <Item market={market} key={key} showModal={showModal} type="borrow" src={src} />;
          })}
          {markets.length === 0 && <Loading />}
        </div>
      </div>
    </section>
  );
}

export default MarketsList;
