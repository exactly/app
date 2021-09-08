import { Market } from "types/Market";
import Item from "components/MarketsList/Item";
import style from "./style.module.scss";

type Props = {
  markets: Array<Market>;
};

function MarketsList({ markets }: Props) {
  return (
    <section className={style.container}>
      <h2>All markets</h2>
      <div className={style.tableRow}>
        <span className={style.symbol}>Market</span>
        <span className={style.address}>Address</span>
        <span className={style.collateralFactor}>Collateral factor</span>
      </div>
      {markets?.map((market, key) => {
        return <Item market={market} key={key} />;
      })}
    </section>
  );
}

export default MarketsList;
