import { ReactNode } from 'react';
import styles from './style.module.scss';

interface Props {
  children: ReactNode;
}

function ModalWrapper({ children }: Props) {
  return <section className={styles.formContainer}>{children}</section>;
}

export default ModalWrapper;
