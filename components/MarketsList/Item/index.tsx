import { Market } from "types/Market";
import style from "./style.module.scss";

type Props = {
  market: Market;
};

function Item({ market }: Props) {
  return (
    <div className={style.container}>
      <div className={style.symbol}>
        <span className={style.primary}>{market?.symbol}</span>
        <span className={style.secondary}>{market?.name}</span>
      </div>
      <span className={style.address}>{market?.address}</span>
      <span className={style.collateralFactor}>{market?.collateralFactor}</span>
    </div>
  );
}

export default Item;
