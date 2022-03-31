import Image from 'next/image';
import styles from './style.module.scss';

type Props = {
  closeModal: (props: any) => void;
};

function ModalClose({ closeModal }: Props) {
  return (
    <div
      className={styles.closeButton}
      onClick={() => {
        closeModal({});
      }}
    >
      <Image src="/img/icons/close.svg" layout="fill" />
    </div>
  );
}

export default ModalClose;
