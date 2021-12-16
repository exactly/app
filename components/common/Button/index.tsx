import { CSSProperties, MouseEventHandler } from 'react';
import styles from './style.module.scss';
import { transformClasses } from 'utils/utils';

import dictionary from 'dictionary/en.json';

type Props = {
  text: string;
  onClick?: MouseEventHandler;
  className?: string;
  style?: CSSProperties;
  loading?: boolean;
  disabled?: boolean;
};

function Button({ text, onClick, className, style, loading, disabled }: Props) {
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
      {loading ? dictionary.loading : text}
    </button>
  );
}

export default Button;
