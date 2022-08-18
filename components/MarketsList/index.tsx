import { useContext } from 'react';

import Item from 'components/MarketsList/Item';

import { Market } from 'types/Market';
import { LangKeys } from 'types/Lang';
import { FixedMarketData } from 'types/FixedMarketData';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';

import style from './style.module.scss';

import keys from './translations.json';

type Props = {
  markets: Array<Market>;
  fixedMarketData: FixedMarketData[] | undefined;
  showModal: (marketData: Market, type: 'borrow' | 'deposit') => void;
};

function MarketsList({ markets, showModal, fixedMarketData }: Props) {
  const fixedLenderData = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={style.container}>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].totalDeposits}</span>
            <span className={style.title}>{translations[lang].averageAPY}</span>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            return (
              <Item
                market={market}
                key={key}
                showModal={showModal}
                type="deposit"
                fixedMarketData={fixedMarketData}
              />
            );
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
            <span className={style.title}>{translations[lang].totalBorrows}</span>
            <span className={style.title}>{translations[lang].averageAPY}</span>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            return (
              <Item
                market={market}
                key={key}
                showModal={showModal}
                type="borrow"
                fixedMarketData={fixedMarketData}
              />
            );
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
