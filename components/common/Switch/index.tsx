import React from 'react';
import styles from './style.module.scss';

type Props = {
  isOn: boolean;
  handleToggle?: () => void;
  onColor?: string;
  id: string;
  disabled?: boolean;
};

const Switch = ({ isOn, handleToggle, id, disabled }: Props) => {
  return (
    <>
      <input
        checked={isOn}
        onChange={handleToggle}
        className={styles.checkbox}
        id={id}
        type="checkbox"
        disabled={disabled}
      />
      <label className={disabled ? styles.disabled : isOn ? styles.label : styles.labelOff} htmlFor={id}>
        <span className={styles.button} />
      </label>
    </>
  );
};

export default Switch;
