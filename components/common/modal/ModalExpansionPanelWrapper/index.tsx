import { ReactNode, useEffect, useRef, useState } from 'react';
import { useSpring, animated } from 'react-spring';

import styles from './style.module.scss';

interface Props {
  children: ReactNode;
}

function ModalExpansionPanelWrapper({ children }: Props) {
  const ref: any = useRef(null);
  const [toggle, setToggle] = useState(false);
  const [style, setStyle] = useSpring(() => ({ height: '0px' }), []);

  useEffect(() => {
    setStyle({
      height: (toggle ? ref.current.offsetHeight : 0) + 'px'
    });
  }, [setStyle, ref, toggle]);

  function handleToggle() {
    setToggle(!toggle);
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className={`${styles.circlePlus} ${toggle ? styles.opened : styles.closed}`}
      >
        <div className={styles.circle}>
          <div className={styles.horizontal}></div>
          <div className={styles.vertical}></div>
        </div>
      </button>
      <animated.div
        style={{
          overflow: 'hidden',
          ...style
        }}
      >
        <div ref={ref} className={styles.test}>
          {children}
        </div>
      </animated.div>
    </>
  );
}

export default ModalExpansionPanelWrapper;
