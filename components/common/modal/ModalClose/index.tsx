import { useEffect } from 'react';
import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  closeModal: (props: any) => void;
};

function ModalClose({ closeModal }: Props) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal(e);
      }
    };

    window.addEventListener('keyup', close);

    return () => window.removeEventListener('keyup', close);
  }, []);
  return (
    <div
      className={styles.closeButton}
      onClick={() => {
        closeModal({});
      }}
    >
      <Image src="/img/icons/close.svg" alt="close" layout="fill" />
    </div>
  );
}

export default ModalClose;
