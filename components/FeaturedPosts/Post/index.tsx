import styles from './style.module.scss';
type Props = {
  title: string;
  description: string;
};

function Post({ title, description }: Props) {
  return (
    <div className={styles.post}>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

export default Post;
