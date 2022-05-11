import { ReactNode } from 'react';
import ModalClose from '../ModalClose';
import styles from './style.module.scss';

interface Props {
  children: ReactNode;
  closeModal: (props: any) => void;
}

function ModalWrapper({ children, closeModal }: Props) {
  return (
    <section className={styles.formContainer}>
      <ModalClose closeModal={closeModal} />
      {children}
    </section>
  );
}

export default ModalWrapper;
