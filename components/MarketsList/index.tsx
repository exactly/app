import { useContext } from 'react';

import Item from 'components/MarketsList/Item';

import { Market } from 'types/Market';
import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';

import style from './style.module.scss';

import keys from './translations.json';

type Props = {
  markets: Array<Market>;
  showModal: (marketData: Market, type: 'borrow' | 'deposit') => void;
};

function MarketsList({ markets, showModal }: Props) {
  const fixedLenderData = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={style.container}>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].marketSize}</span>
            <span className={style.title}>{translations[lang].lastAPY}</span>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} showModal={showModal} type="deposit" />;
          })}
          {markets.length === 0 &&
            fixedLenderData.map((_, key) => {
              return <Item key={key} />;
            })}
        </div>
      </div>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].marketSize}</span>
            <span className={style.title}>{translations[lang].lastAPY}</span>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} showModal={showModal} type="borrow" />;
          })}
          {markets.length === 0 &&
            fixedLenderData.map((_, key) => {
              return <Item key={key} />;
            })}
        </div>
      </div>
    </section>
  );
}

export default MarketsList;
