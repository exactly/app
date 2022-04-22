import styles from './style.module.scss';

type Props = {
  size?: string;
  white?: boolean;
};

function Loading({ size = 'normal', white = false }: Props) {
  return (
    <div
      className={
        size == 'normal'
          ? `${styles.loading} ${white && styles.white}`
          : `${styles.loadingSmall}  ${white && styles.white}`
      }
    >
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

export default Loading;
