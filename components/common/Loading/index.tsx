import React from 'react';
import styles from './style.module.scss';

type Props = {
  size?: string;
  color?: string;
};

function Loading({ size = 'normal', color = 'white' }: Props) {
  return (
    <div
      className={size === 'normal' ? `${styles.loading} ${styles[color]}` : `${styles.loadingSmall}  ${styles[color]}`}
    >
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

export default Loading;
