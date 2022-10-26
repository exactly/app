import { CSSProperties, MouseEventHandler } from 'react';

import styles from './style.module.scss';
import Dropdown, { Option } from 'react-dropdown';

import 'react-dropdown/style.css';

type Props = {
  className?: string;
  onChange: (arg: Option) => void;
  onClick?: MouseEventHandler;
  placeholder?: any;
  value?: any;
  name?: string;
  style?: CSSProperties;
  disabled?: boolean;
  options: Array<Option>;
  editable?: boolean;
};

function Select({ className = '', onChange, onClick, disabled, options, placeholder, value, editable }: Props) {
  const containerClass = editable ? 'containerEditable' : 'container';
  const selectClass = editable ? 'selectEditable' : 'select';
  const arrowClass = editable ? 'arrowEditable' : 'arrow';
  const menuClass = editable ? 'menuEditable' : 'menu';

  return (
    <div onClick={onClick}>
      <Dropdown
        options={options}
        onChange={onChange}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        className={styles[containerClass]}
        placeholderClassName={styles.placeholder}
        controlClassName={`${styles[selectClass]} ${className}`}
        menuClassName={styles[menuClass]}
        arrowClassName={styles[arrowClass]}
        arrowClosed={<span className={styles.arrowClosed} />}
      />
    </div>
  );
}

export default Select;
