import React, { CSSProperties, MouseEventHandler } from 'react';
import styles from './style.module.scss';

import { transformClasses } from 'utils/utils';

import Loading from '../Loading';

type Props = {
  text: string;
  onClick?: MouseEventHandler;
  className?: string;
  style?: CSSProperties;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
};

function Button({ text, onClick, className, style, loading, disabled, color }: Props) {
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
      {loading ? <Loading size="small" color={color} /> : text}
    </button>
  );
}

export default Button;
