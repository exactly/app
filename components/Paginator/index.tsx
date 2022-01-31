import styles from './style.module.scss'

interface Props {
  total: number,
  itemsPerPage: number
  handleChange: (page: number) => void;
  currentPage: number;
}

function Paginator({ total, itemsPerPage, handleChange, currentPage }: Props) {
  const pages = Math.ceil(total / itemsPerPage);

  return (
    <ul className={styles.container}>
      <li className={styles.item} onClick={() => handleChange(currentPage - 1 >= 1 ? currentPage - 1 : 1)}>{"<"}</li>

      {Array.from(Array(pages).keys()).map((_, key) => {
        const value = key + 1;
        return (
          <li className={`${styles.item} ${currentPage == value ? styles.active : ""}`} key={key} onClick={() => handleChange(value)}>{value}</li>
        )
      })}
      <li className={styles.item} onClick={() => handleChange(currentPage + 1 <= pages ? currentPage + 1 : pages)}>{">"}</li>
    </ul>
  )
}

export default Paginator;