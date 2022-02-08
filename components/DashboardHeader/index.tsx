import DonutChart from 'components/DonutChart';
import styles from './style.module.scss';

function DashboardHeader() {
  return (
    <section className={styles.section}>
      <div className={styles.deposit}>
        <div className={styles.box}>
          <h3 className={styles.title}>Deposits</h3>
          <p className={styles.value}>$6,724</p>
          <p className={styles.subvalue}>2.14% APR</p>
        </div>
        <div>
          <DonutChart />
        </div>
        <div className={styles.line}></div>
        <div className={styles.box}>
          <h3 className={styles.title}>Rate Composition</h3>
        </div>
        <div>CHART</div>
      </div>
      <div className={styles.borrow}>
        <div className={styles.box}>
          <h3 className={styles.title}>Borrow</h3>
          <p className={styles.value}>$6,724</p>
          <p className={styles.subvalue}>2.14% APR</p>
        </div>
        <div className={styles.box}>
          <h3 className={styles.title}>Borrow</h3>
          <p className={styles.value}>6,6%</p>
          <p className={styles.subvalue}>coin</p>
        </div>
      </div>
    </section>
  );
}

export default DashboardHeader;
