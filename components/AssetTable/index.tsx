import { useContext } from 'react';

import LangContext from 'contexts/LangContext';
import { AddressContext } from 'contexts/AddressContext';

import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import Item from './Item';

interface Props {
  page: number;
  itemsPerPage: number;
  symbol: string;
  deposits: Array<Maturity> | undefined;
  borrows: Array<Maturity> | undefined;
}

function AssetTable({ page, itemsPerPage, symbol, deposits, borrows }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { dates } = useContext(AddressContext);

  return (
    <div className={styles.table}>
      <div className={styles.row}>
        <div className={styles.maturity}>{translations[lang].maturity}</div>
        <div className={styles.lastFixedRate}>{translations[lang].lastAPY}</div>
        <div className={styles.actions}></div>
      </div>
      {dates && (
        <>
          {dates
            ?.slice(itemsPerPage * (page - 1), itemsPerPage * page)
            .map((maturity: Maturity, key: number) => {
              return (
                <Item
                  key={key}
                  symbol={symbol}
                  maturity={maturity}
                  deposits={deposits}
                  borrows={borrows}
                />
              );
            })}
        </>
      )}
      {!dates &&
        Array(3)
          .fill('a')
          .map((_, key: number) => {
            return (
              <Item
                key={key}
                symbol={symbol}
                maturity={undefined}
                deposits={undefined}
                borrows={undefined}
              />
            );
          })}
    </div>
  );
}

export default AssetTable;
