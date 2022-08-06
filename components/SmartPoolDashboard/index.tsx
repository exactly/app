import { useContext } from 'react';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Option } from 'react-dropdown';

import SmartPoolUserStatus from 'components/SmartPoolUserStatus';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  showModal: (data: Deposit, type: String) => void;
  tab: Option;
};

function SmartPoolDashboard({ showModal, tab }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { walletAddress } = useWeb3Context();

  return (
    <section className={styles.container}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].smartPool}</p>
      </div>
      <SmartPoolUserStatus walletAddress={walletAddress} showModal={showModal} type={tab} />
    </section>
  );
}

export default SmartPoolDashboard;
