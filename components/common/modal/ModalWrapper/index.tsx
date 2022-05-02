import React from 'react';
import styles from './style.module.scss';

interface Props {
  children: React.ReactNode;
}

function ModalWrapper({ children }: Props) {
  return <section className={styles.formContainer}>{children}</section>;
}

export default ModalWrapper;
