import { useEffect, useState } from 'react';
import styles from './style.module.scss';

function SpecialText() {
  const [status, setStatus] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((status) => !status);
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className={styles.specialText}>
      <p className={styles.first}>
        <span className={`${status ? styles.blue : styles.green} ${styles.space}`}>{status ? 'Borrow' : 'Lend'}</span>{' '}
        <span className={styles.text}>knowing Exactly how</span>
      </p>{' '}
      <p className={styles.second}>
        <span className={styles.text}>much you are gonna </span>
        <span className={`${status ? styles.blue : styles.green} ${styles.space}`}>{status ? 'pay' : 'earn'}</span>
      </p>
    </div>
  );
}

export default SpecialText;
