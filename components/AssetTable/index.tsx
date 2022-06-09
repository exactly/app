import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';
import Item from './Item';

interface Props {
  maturities: Array<Maturity> | undefined;
  market: string;
  showModal: (type: string, maturity: string | undefined) => void;
}

function AssetTable({ maturities, market, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.table}>
      <div className={styles.row}>
        <div className={styles.maturity}>{translations[lang].maturity}</div>
        <div className={styles.lastFixedRate}>{translations[lang].lastFixedRate}</div>
        <div className={styles.actions}></div>
      </div>
      {maturities && (
        <>
          {maturities.map((maturity: Maturity, key: number) => {
            return <Item key={key} maturity={maturity} market={market} showModal={showModal} />;
          })}
        </>
      )}
      {!maturities &&
        Array(3)
          .fill('a')
          .map((_, key: number) => {
            return <Item key={key} maturity={undefined} market={undefined} showModal={showModal} />;
          })}
    </div>
  );
}

export default AssetTable;
