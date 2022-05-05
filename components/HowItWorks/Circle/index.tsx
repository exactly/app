import styles from './style.module.scss';

type Props = {
  title: string;
  description: string;
  type?: string;
  icon: string;
};

function Circle({ title, description, icon, type }: Props) {
  return (
    <div className={styles.circleContainer}>
      <div className={`${styles.circle} ${type ? styles[type] : styles.primary}`}>
        <img src={icon} alt={title} />
      </div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

export default Circle;
