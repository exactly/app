import { Market } from "types/Market";
import Item from "components/MarketsList/Item";
import style from "./style.module.scss";

type Props = {
  markets: Array<Market>;
};

function MarketsList({ markets }: Props) {
  return (
    <section className={style.container}>
      {/* <h2>All markets</h2> */}
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>Asset</span>
            <span className={style.collateralFactor}>Collateral factor</span>
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} />;
          })}
        </div>
      </div>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>Asset</span>
            <span className={style.collateralFactor}>Collateral factor</span>
          </div>
          {markets?.map((market, key) => {
            return <Item market={market} key={key} />;
          })}
        </div>
      </div>
    </section>
  );
}

export default MarketsList;
