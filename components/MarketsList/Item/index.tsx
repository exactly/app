import { Market } from "types/Market";
import style from "./style.module.scss";

type Props = {
  market: Market;
  showModal: Function;
};

function Item({ market, showModal }: Props) {
  function handleClick() {
    showModal(market?.address);
  }

  return (
    <div className={style.container} onClick={handleClick}>
      <div className={style.symbol}>
        <span className={style.primary}>{market?.symbol}</span>
        <span className={style.secondary}>{market?.name}</span>
      </div>
      {/* <span className={style.address}>{market?.address}</span> */}
      <span className={style.collateralFactor}>{market?.collateralFactor}</span>
    </div>
  );
}

export default Item;
