import { useState } from 'react';
import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  value: string;
  image?: string;
  children?: any;
  disableImage?: boolean;
  orientation?: string;
};

function Tooltip({ value, image, children, disableImage, orientation = 'up' }: Props) {
  const [show, setShow] = useState<boolean>(false);

  return (
    <div className={styles.tooltipContainer} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {!disableImage && <Image src={image ?? '/img/icons/tooltip.svg'} alt="tooltip" width={18} height={18} />}

      {orientation == 'up' && (
        <div className={`${styles.tooltipUp} ${show ? styles.show : styles.hidden}`}>
          <div className={styles.arrow}></div>
          <p className={styles.text}>{value}</p>
        </div>
      )}

      {/* this should change if we use other tables and/or fix the overflow problem */}
      {orientation == 'down' && (
        <div className={`${styles.tooltipDown} ${show ? styles.show : styles.hidden}`}>
          <div className={styles.arrow}></div>
          <p className={styles.text}>{value}</p>
        </div>
      )}
    </div>
  );
}

export default Tooltip;
