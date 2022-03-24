import { useContext } from 'react';

import AlertMessage from 'components/AlertMessage';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

function CurrentNetwork() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { network } = useWeb3Context();

  return (
    <div className={styles.network}>
      <AlertMessage
        label={`<span>${translations[lang].connectedTo} <strong>${
          network?.name ?? 'unknown'
        }</strong> ${translations[lang].network}</span>`}
        status={network?.name ? 'success' : 'error'}
      />
    </div>
  );
}

export default CurrentNetwork;
