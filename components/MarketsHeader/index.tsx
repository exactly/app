import { useContext, useMemo } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';

function MarketsHeader() {
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { totalBorrowed, totalDeposited } = useMemo(() => {
    if (!accountData) return { totalBorrowed: 'N/A', totalDeposited: 'N/A' };
    let totalDeposited = parseFixed('0', 18);
    let totalBorrowed = parseFixed('0', 18);

    Object.keys(accountData).forEach((asset) => {
      const assetData = accountData[asset];
      const oraclePrice = assetData.oraclePrice;
      const decimalWAD = parseFixed('1', assetData.decimals);

      totalDeposited = totalDeposited.add(
        assetData.totalFloatingDepositAssets.mul(oraclePrice).div(decimalWAD)
      );

      totalBorrowed = totalBorrowed.add(
        assetData.totalFloatingBorrowAssets.mul(oraclePrice).div(decimalWAD)
      );

      assetData.fixedPools.forEach((fixedPool) => {
        totalDeposited = totalDeposited.add(fixedPool.supplied.mul(oraclePrice).div(decimalWAD));
        totalBorrowed = totalBorrowed.add(fixedPool.borrowed.mul(oraclePrice).div(decimalWAD));
      });
    });

    return {
      totalBorrowed: `$${formatNumber(formatFixed(totalBorrowed, 18), 'USD')}`,
      totalDeposited: `$${formatNumber(formatFixed(totalDeposited, 18), 'USD')}`
    };
  }, [accountData]);

  return (
    <section className={styles.headerSection}>
      <h1>{translations[lang].title}</h1>
      <section className={styles.stats}>
        <section className={styles.stat}>
          <h3 className={styles.statTitle}>{translations[lang]?.totalDeposited?.toUpperCase()}</h3>
          <p className={styles.statValue}>{totalDeposited}</p>
        </section>
        <section className={styles.stat}>
          <h3 className={styles.statTitle}>{translations[lang]?.totalBorrowed?.toUpperCase()}</h3>
          <p className={styles.statValue}>{totalBorrowed}</p>
        </section>
      </section>
    </section>
  );
}

export default MarketsHeader;
