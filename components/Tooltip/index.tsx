import { useState } from 'react';
import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  value: String;
  image?: string;
  children?: any;
  disableImage?: boolean;
};

function Tooltip({ value, image, children, disableImage }: Props) {
  const [show, setShow] = useState<Boolean>(false);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {!disableImage && (
        <Image src={image ?? '/img/icons/tooltip.svg'} alt="tooltip" width={18} height={18} />
      )}
      <div className={`${styles.tooltip} ${show ? styles.show : styles.hidden}`}>
        <div className={styles.arrowUp}></div>
        <p className={styles.text}>{value}</p>
      </div>
    </div>
  );
}

export default Tooltip;
