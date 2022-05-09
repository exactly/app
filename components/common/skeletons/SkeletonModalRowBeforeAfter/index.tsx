import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import styles from './style.module.scss';

type Props = {
  text: string;
};

function SkeletonModalRowBeforeAfter({ text }: Props) {
  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{text}</p>
      <section className={styles.values}>
        <Skeleton width={40} />
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <Skeleton width={40} />
      </section>
    </section>
  );
}

export default SkeletonModalRowBeforeAfter;
