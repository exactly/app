import { MouseEventHandler, CSSProperties } from 'react';

import styles from './style.module.scss';
import Dropdown, { Option } from 'react-dropdown';

import 'react-dropdown/style.css';

type Props = {
  className?: string;
  onChange: Function;
  onClick?: MouseEventHandler;
  placeholder?: any;
  value?: any;
  name?: string;
  style?: CSSProperties;
  disabled?: boolean;
  options: Array<Option>;
};

function Select({
  className = '',
  onChange,
  onClick,
  disabled,
  options,
  placeholder,
  value
}: Props) {
  function handleChange(option: Option) {
    onChange(option);
  }

  return (
    <div onClick={onClick}>
      <Dropdown
        options={options}
        onChange={(option) => handleChange(option)}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        className={styles.container}
        placeholderClassName={styles.placeholder}
        controlClassName={`${styles.select} ${className}`}
        menuClassName={styles.menu}
        arrowClassName={styles.arrow}
        arrowClosed={<span className={styles.arrowClosed} />}
      />
    </div>
  );
}

export default Select;
