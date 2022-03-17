import { useContext } from 'react';

import { LangKeys } from 'types/Lang';
import { Dictionary } from 'types/Dictionary';

import Tooltip from 'components/Tooltip';
import SmartPoolUserStatus from 'components/SmartPoolUserStatus';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  walletAddress: string;
  deposits: Dictionary<number> | undefined;
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
      <SmartPoolUserStatus deposits={deposits} walletAddress={walletAddress} />
    </section>
  );
}

export default SmartPoolDashboard;
