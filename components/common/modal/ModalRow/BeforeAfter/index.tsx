import Image from 'next/image';
import styles from './style.module.scss';

type Props = {
  values: Array<string>;
};

function BeforeAfter({ values }: Props) {
  return (
    <section className={styles.values}>
      <span>{values[0]}</span>
      <div className={styles.imageContainer}>
        <Image src="/img/icons/arrowRight.svg" layout="fill" />
      </div>
      <span>{values[1]}</span>
    </section>
  );
}

export default BeforeAfter;
