import Button from 'components/common/Button';
import Loading from 'components/common/Loading';
import { Maturity } from 'types/Maturity';
import styles from './style.module.scss';

interface Props {
  maturities: Array<Maturity> | undefined;
}

function AssetTable({ maturities }: Props) {
  return (
    <div className={styles.table}>
      <div className={styles.row}>
        <div className={styles.maturity}>Maturity</div>
        <div className={styles.lastFixedRate}>Last fixed rate</div>
        <div className={styles.actions}></div>

      </div>
      {maturities ? (
        <>
          {maturities.map((maturity: Maturity, key: number) => {
            return (
              <div className={styles.row} key={key}>
                <div className={styles.maturity}>
                  <span>{maturity.label}</span>
                  <span className={styles.liquidity}>Liquidity: </span>
                </div>
                <div className={styles.lastFixedRate}>
                  <div className={styles.deposit}>4,41%</div>
                  <div className={styles.borrow}>3,16%</div>
                </div>
                <div className={styles.actions}>
                  <div className={styles.buttonContainer}>
                    <Button text="Deposit" className="primary" />
                  </div>
                  <div className={styles.buttonContainer}>
                    <Button text="Borrow" className="secondary" />
                  </div>
                </div>

              </div>
            );
          })}
        </>
      ) : (
        <div className={styles.center}>
          <Loading />
        </div>
      )}
    </div>
  );
}

export default AssetTable;
