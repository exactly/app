import Button from 'components/common/Button';
import { Market } from 'types/Market';
import style from './style.module.scss';

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  type: 'borrow' | 'deposit';
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
