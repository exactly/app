import Loading from "components/common/Loading";
import { Maturity } from "types/Maturity";
import styles from './style.module.scss';

interface Props {
  maturities: Array<Maturity> | undefined
}

function AssetTable({maturities}: Props) {
  return (
    <div className={styles.table}>
      {maturities ? (
        <>
        {maturities.map((maturity: Maturity, key: number) => {
          return (
            <div className={styles.row}>
              <div className={styles.maturity}>

              <span>{maturity.label}</span>
              <span className={styles.liquidity}>Liquidity: </span>
              </div>
            </div>
          )
        })}
        </>
      ) : (
        <Loading />
      )}
      
    </div>
  )
}

export default AssetTable;