import styles from './style.module.scss';

type Props = {
  size?: string;
};

function Loading({ size = 'normal' }: Props) {
  return (
    <div className={size == 'normal' ? styles.loading : styles.loadingSmall}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

export default Loading;
