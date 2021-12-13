import Item from 'components/MarketsList/Item';

import style from './style.module.scss';

import dictionary from 'dictionary/en.json';
import assets from 'dictionary/assets.json';

import { Market } from 'types/Market';
import { Assets } from 'types/Assets';

type Props = {
  markets: Array<Market>;
  showModal: Function;
};

function MarketsList({ markets, showModal }: Props) {
  return (
    <section className={style.container}>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{dictionary.asset}</span>
            <span className={style.collateralFactor}>
              {dictionary.collateral}
            </span>
            <span className={style.collateralFactor} />
          </div>
          {markets?.map((market, key) => {
            const symbol: keyof Market = market.symbol;
            const assetsData: Assets<symbol> = assets;
            const src: string = assetsData[symbol];

            return (
              <Item
                market={market}
                key={key}
                showModal={showModal}
                type="deposit"
                src={src}
              />
            );
          })}
        </div>
      </div>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{dictionary.asset}</span>
            <span className={style.collateralFactor}>
              {dictionary.collateral}
            </span>
            <span className={style.collateralFactor} />
          </div>
          {markets?.map((market, key) => {
            const symbol: keyof Market = market.symbol;
            const assetsData: Assets<symbol> = assets;
            const src: string = assetsData[symbol];

            return (
              <Item
                market={market}
                key={key}
                showModal={showModal}
                type="borrow"
                src={src}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MarketsList;
