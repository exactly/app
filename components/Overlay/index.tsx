import React from 'react';
import { useSpring, animated } from 'react-spring';

import styles from './style.module.scss';

type Props = {
  close: () => void;
};

function Overlay({ close }: Props) {
  const style = useSpring({ from: { opacity: 0 }, to: { opacity: 0.5 }, duration: 10000 });

  return <animated.div style={style} className={styles.overlay} onClick={close} />;
}

export default Overlay;
