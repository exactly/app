import React, { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  message: string | undefined;
};

function ModalError({ message }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return <p className={styles.message}>{message ?? translations[lang].error}</p>;
}

export default ModalError;
