import styles from './style.module.scss'

interface Props {
  title: string,
  value: string
}

function AssetInfo({ title, value }: Props) {
  return (
    <div className={styles.assetInfoContainer}>
      <div className={styles.titleContainer}>{title}</div>
      <span className={styles.value}>{value}</span>
    </div>
  )
}

export default AssetInfo;