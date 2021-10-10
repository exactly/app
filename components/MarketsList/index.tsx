import { Market } from "types/Market";
import Item from "components/MarketsList/Item";
import style from "./style.module.scss";
import dictionary from "dictionary/en.json";

type Props = {
  markets: Array<Market>;
  showModal: Function;
};

function MarketsList({ markets, showModal }: Props) {
  return (
    <section className={style.container}>
      {/* <h2>All markets</h2> */}
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{dictionary.asset}</span>
            <span className={style.collateralFactor}>
              {dictionary.collateral}
            </span>
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} showModal={showModal} />;
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
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} showModal={showModal} />;
          })}
        </div>
      </div>
    </section>
  );
}

export default MarketsList;
