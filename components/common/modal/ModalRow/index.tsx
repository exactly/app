import Skeleton from 'react-loading-skeleton';
import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  text: string;
  textTooltip?: string;
  value?: string;
  valueTooltip?: string;
  line?: boolean;
  asset?: string;
};

function ModalRow({ text, value, line, asset }: Props) {
  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{text}</p>

      <>
        {asset && (
          <Image
            src={`/img/assets/${asset.toLowerCase()}.svg`}
            alt={asset}
            width="24"
            height="24"
          />
        )}

        <p className={styles.value}>{value || <Skeleton />}</p>
      </>
    </section>
  );
}

export default ModalRow;
