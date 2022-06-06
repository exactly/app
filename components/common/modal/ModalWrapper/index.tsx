import { ReactNode } from 'react';
import { useSpring, animated } from 'react-spring';

import ModalClose from '../ModalClose';

import styles from './style.module.scss';

interface Props {
  children: ReactNode;
  closeModal: (props: any) => void;
}

function ModalWrapper({ children, closeModal }: Props) {
  const style = useSpring({ from: { opacity: 0 }, to: { opacity: 1 }, duration: 10000 });

  return (
    <animated.section style={style} className={styles.formContainer}>
      <ModalClose closeModal={closeModal} />
      {children}
    </animated.section>
  );
}

export default ModalWrapper;
