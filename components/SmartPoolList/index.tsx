import React, { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Item = dynamic(() => import('./Item'));
import Tooltip from 'components/Tooltip';

import { Market } from 'types/Market';
import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';

import formatMarkets from 'utils/formatMarkets';

function SmartPoolList() {
  //this is only used to render the skeletons, the data is not read in any moment
  const fixedLenderData = useContext(FixedLenderContext);

  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    getMarkets();
  }, [accountData]);

  async function getMarkets() {
    if (!accountData) return;

    try {
      setMarkets(formatMarkets(accountData));
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <section className={styles.container}>
      <div className={styles.sectionTitleContainer}>
        <p className={styles.sectionTitle}>{translations[lang].smartPool}</p>
      </div>
      <div className={styles.marketsContainer}>
        <div className={styles.market}>
          <div className={styles.column}>
            <div className={styles.tableRow}>
              <div className={styles.symbol}>{translations[lang].asset}</div>
              <div className={styles.title}>{translations[lang].totalDeposits}</div>
              <div className={styles.title}>
                {translations[lang].lastAPR} <Tooltip value={translations[lang].lastAprTooltip} orientation="down" />
              </div>
              <div className={styles.title} />
            </div>
            {markets?.map((market, key) => {
              return <Item market={market} key={key} type={'deposit'} />;
            })}
            {!markets.length &&
              fixedLenderData.map((_, key) => {
                return <Item key={key} market={undefined} type={'deposit'} />;
              })}
          </div>
        </div>
        <div className={styles.market}>
          <div className={styles.column}>
            <div className={styles.tableRow}>
              <div className={styles.symbol}>{translations[lang].asset}</div>
              <div className={styles.title}>{translations[lang].totalBorrows}</div>
              <div className={styles.title}>
                {translations[lang].lastAPR} <Tooltip value={translations[lang].lastAprTooltip} orientation="down" />
              </div>
              <div className={styles.title} />
            </div>
            {markets?.map((market, key) => {
              return <Item market={market} key={key} type={'borrow'} />;
            })}
            {!markets.length &&
              fixedLenderData.map((_, key) => {
                return <Item key={key} market={undefined} type={'borrow'} />;
              })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SmartPoolList;
