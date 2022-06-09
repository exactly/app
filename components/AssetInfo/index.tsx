import styles from './style.module.scss';

interface Props {
  title: string;
  value: number | string | undefined;
  symbol?: string;
}

function AssetInfo({ title, value, symbol }: Props) {
  return (
    <div className={styles.assetInfoContainer}>
      <div className={styles.titleContainer}>{title}</div>
      <span className={styles.value}>
        {value} {symbol}
      </span>
    </div>
  );
}

export default AssetInfo;
