import styles from './style.module.scss';

type Props = {
  title: string;
};
function ModalTitle({ title }: Props) {
  return <h4 className={styles.title}>{title}</h4>;
}

export default ModalTitle;
