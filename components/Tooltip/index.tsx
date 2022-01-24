import { useState } from 'react';

import styles from './style.module.scss';

type Props = {
  value?: String;
};

function Tooltip({ value }: Props) {
  const [show, setShow] = useState<Boolean>(false);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <img src="/img/icons/tooltip.svg" />
      <div
        className={`${styles.tooltip} ${show ? styles.show : styles.hidden}`}
      >
        <div className={styles.arrowUp}></div>
        <p className={styles.text}>{value || 'Placeholder tooltip'}</p>
      </div>
    </div>
  );
}

export default Tooltip;
