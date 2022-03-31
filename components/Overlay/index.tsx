import styles from './style.module.scss';

type Props = {
  closeModal?: any;
};

function Overlay({ closeModal }: Props) {
  return <div className={styles.overlay} onClick={closeModal} />;
}

export default Overlay;
