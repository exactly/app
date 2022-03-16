import { useContext } from 'react';

import { LangKeys } from 'types/Lang';

import Tooltip from 'components/Tooltip';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';
import SmartPoolUserStatus from 'components/SmartPoolUserStatus';
import { Deposit } from 'types/Deposit';

type Props = {
  deposits: Deposit[];
  walletAddress: string;
  showModal: any;
};

function SmartPoolDashboard({ deposits, walletAddress, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <section className={styles.container}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].smartPool}</p>
        <Tooltip value={translations[lang].smartPool} />
      </div>
      <SmartPoolUserStatus
        deposits={deposits}
        walletAddress={walletAddress}
        showModal={showModal}
      />
    </section>
  );
}

export default SmartPoolDashboard;
