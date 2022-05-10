import { ReactNode, useEffect } from 'react';
import styles from './style.module.scss';

interface Props {
  children: ReactNode;
  closeModal: (props: any) => void;
}

function ModalWrapper({ children, closeModal }: Props) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal(e);
      }
    };

    window.addEventListener('keyup', close);

    return () => window.removeEventListener('keyup', close);
  }, []);

  return <section className={styles.formContainer}>{children}</section>;
}

export default ModalWrapper;
