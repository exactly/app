import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

import { FixedLenderAccountData } from 'types/FixedLenderAccountData';
import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import AccountDataContext from 'contexts/AccountDataContext';
import LangContext from 'contexts/LangContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

const MaturityPoolUserStatusByMaturity = dynamic(
  () => import('components/MaturityPoolUserStatusByMaturity')
);
const Button = dynamic(() => import('components/common/Button'));
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
  const { setModalContent, setOpen } = useContext(ModalStatusContext);

  const [defaultMaturity, setDefaultMaturity] = useState<string>();
  const [maturities, setMaturities] = useState<any>(undefined);

  useEffect(() => {
    if (!defaultMaturity) {
      getDefaultMaturity();
    }
  }, [defaultMaturity]);

  useEffect(() => {
    if (accountData) {
      getMaturityPools();
    }
  }, [accountData]);

  async function getDefaultMaturity() {
    const currentTimestamp = dayjs().unix();
    const interval = 2419200;
    const timestamp = currentTimestamp - (currentTimestamp % interval) + interval;

    setDefaultMaturity(timestamp.toString());
  }

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
                decimals: asset.decimals
              }
            ]
          : [
              {
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals
              }
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
                decimals: asset.decimals
              }
            ]
          : [
              {
                symbol: asset.assetSymbol,
                market: asset.market,
                fee: pool.position.fee,
                principal: pool.position.principal,
                decimals: asset.decimals
              }
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
        <div className={styles.buttonContainer}>
          {accountData && (
            <Button
              text={
                tab.value == 'borrow' ? translations[lang].newBorrow : translations[lang].newDeposit
              }
              className={tab.value == 'borrow' ? 'secondary' : 'primary'}
              onClick={() => {
                setOpen(true);
                setModalContent({
                  assets: '0',
                  fee: '0',
                  market: accountData.DAI.market!,
                  maturity: defaultMaturity!,
                  type: tab.value,
                  editable: true
                });
              }}
            />
          )}
        </div>
      </section>
      {maturities ? (
        <MaturityPoolUserStatusByMaturity type={tab} maturities={maturities} />
      ) : (
        <MaturityPoolUserStatusByMaturity type={undefined} maturities={undefined} />
      )}
      {tab.value == 'deposit' && maturities && !maturities.hasOwnProperty('deposits') && (
        <EmptyState connected tab={tab.value} />
      )}
      {tab.value == 'borrow' && maturities && !maturities.hasOwnProperty('borrows') && (
        <EmptyState connected tab={tab.value} />
      )}
    </section>
  );
}

export default MaturityPoolDashboard;
