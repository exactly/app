import Button from 'components/common/Button';
import { Market } from 'types/Market';
import style from './style.module.scss';
import assets from 'dictionary/assets.json';

type Props = {
  market: Market;
  showModal: Function;
  type: String;
  src: string;
};

function Item({ market, showModal, type, src }: Props) {
  function handleClick() {
    showModal(market?.address, type);
  }

  return (
    <div
      className={`${style.container} ${
        type == 'borrow' ? style.secondaryContainer : style.primaryContainer
      }`}
      onClick={handleClick}
    >
      <div className={style.symbol}>
        <img src={src} className={style.assetImage} />
        <span className={style.primary}>{market?.symbol}</span>
      </div>
      <span className={style.collateralFactor}>{market?.collateralFactor}</span>
      <div className={style.buttonContainer}>
        <Button
          text={type == 'borrow' ? 'Borrow' : 'Deposit'}
          className={type == 'borrow' ? 'secondary' : 'primary'}
        />
      </div>
    </div>
  );
}

export default Item;
