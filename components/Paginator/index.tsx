import { useContext } from 'react';

import { MarketContext } from 'contexts/MarketContext';

import styles from './style.module.scss';

interface Props {
  itemsPerPage: number;
  handleChange: (page: number) => void;
  currentPage: number;
}

function Paginator({ itemsPerPage, handleChange, currentPage }: Props) {
  const { dates } = useContext(MarketContext);

  const pages = Math.ceil(dates.length / itemsPerPage);

  return (
    <ul className={styles.container}>
      <li
        className={styles.arrow}
        onClick={() => handleChange(currentPage - 1 >= 1 ? currentPage - 1 : 1)}
      >
        {'<'}
      </li>

      {Array.from(Array(pages).keys()).map((_, key) => {
        const value = key + 1;
        return (
          <li
            className={`${styles.item} ${currentPage == value ? styles.active : ''}`}
            key={key}
            onClick={() => handleChange(value)}
          >
            {value}
          </li>
        );
      })}

      <li
        className={styles.arrow}
        onClick={() => handleChange(currentPage + 1 <= pages ? currentPage + 1 : pages)}
      >
        {'>'}
      </li>
    </ul>
  );
}

export default Paginator;
