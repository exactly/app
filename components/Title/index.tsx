import styles from './style.module.scss';

type Props = {
  title: string;
  subtitle?: string;
};

function Title({ title, subtitle }: Props) {
  return (
    <div className={styles.titleContainer}>
      <img src="/img/icons/diamond.svg" alt="diamond" />
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

export default Title;
