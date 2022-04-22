import { CSSProperties, MouseEventHandler, useContext } from 'react';
import styles from './style.module.scss';

import { transformClasses } from 'utils/utils';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';
import Loading from '../Loading';

type Props = {
  text: string;
  onClick?: MouseEventHandler;
  className?: string;
  style?: CSSProperties;
  loading?: boolean;
  disabled?: boolean;
};

function Button({ text, onClick, className, style, loading, disabled }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  let parsedClassName = '';

  if (className) {
    parsedClassName = transformClasses(styles, className);
  }
  return (
    <button
      style={style ?? undefined}
      className={`${styles.button} ${parsedClassName}`}
      onClick={onClick}
      disabled={disabled ?? false}
    >
      {loading ? <Loading size="small" white /> : text}
    </button>
  );
}

export default Button;
