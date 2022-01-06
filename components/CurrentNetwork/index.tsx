import { useContext } from 'react';

import AlertMessage from 'components/AlertMessage';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  network: {
    name: String;
  };
};

function CurrentNetwork({ network }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.network}>
      <AlertMessage
        label={`<span>${translations[lang].connectedTo} <strong>${network?.name}</strong> ${translations[lang].network}</span>`}
        status={network ? 'success' : 'error'}
      />
    </div>
  );
}

export default CurrentNetwork;
