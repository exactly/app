import { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { FixedLenderAccountData } from 'types/FixedLenderAccountData';
import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import AccountDataContext from 'contexts/AccountDataContext';
import LangContext from 'contexts/LangContext';

const MaturityPoolUserStatusByMaturity = dynamic(() => import('components/MaturityPoolUserStatusByMaturity'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import styles from './style.module.scss';

import keys from './translations.json';

interface Props {
  tab: Option;
}

function MaturityPoolDashboard({ tab }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { accountData } = useContext(AccountDataContext);

  const [maturities, setMaturities] = useState<any>(undefined);

  useEffect(() => {
    if (accountData) {
      getMaturityPools();
    }
  }, [accountData]);

  async function getMaturityPools() {
    const data: any = {};

    Object.values(accountData!).forEach((asset: FixedLenderAccountData) => {
      asset.fixedDepositPositions.forEach((pool) => {
        const date = pool.maturity.toNumber().toString();
        data.deposits = data.deposits ?? {};

        data.deposits[date] = data.deposits[date]
          ? [
              ...data.deposits[date],
              {
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ]
          : [
              {
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ];
      });

      asset.fixedBorrowPositions.forEach((pool) => {
        const date = pool.maturity.toNumber().toString();
        data.borrows = data.borrows ?? {};

        data.borrows[date] = data.borrows[date]
          ? [
              ...data.borrows[date],
              {
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ]
          : [
              {
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals,
              },
            ];
      });
    });

    setMaturities(data);
  }

  return (
    <section className={styles.container}>
      <section className={styles.sectionContainer}>
        <div className={styles.titleContainer}>
          <p className={styles.title}>{translations[lang].maturityPools}</p>
        </div>
      </section>
      {maturities ? (
        <MaturityPoolUserStatusByMaturity type={tab} maturities={maturities} />
      ) : (
        <MaturityPoolUserStatusByMaturity type={undefined} maturities={undefined} />
      )}
      {tab.value == 'deposit' && !maturities?.deposits && <EmptyState connected tab={tab.value} />}
      {tab.value == 'borrow' && !maturities?.borrows && <EmptyState connected tab={tab.value} />}
    </section>
  );
}

export default MaturityPoolDashboard;
