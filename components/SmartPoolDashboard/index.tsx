import { useContext } from 'react';

import { LangKeys } from 'types/Lang';

import Tooltip from 'components/Tooltip';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import styles from './style.module.scss';

import keys from './translations.json';
import SmartPoolUserStatus from 'components/SmartPoolUserStatus';

import { Dictionary } from 'types/Dictionary';

type Props = {
  deposits: Dictionary<number> | undefined;
};

function SmartPoolDashboard({ deposits }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { address } = useWeb3Context();

  return (
    <section className={styles.container}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].smartPool}</p>
        <Tooltip value={translations[lang].smartPool} />
      </div>
      <SmartPoolUserStatus deposits={deposits} walletAddress={address} />
    </section>
  );
}

export default SmartPoolDashboard;
