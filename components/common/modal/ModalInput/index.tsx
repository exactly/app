import { ChangeEventHandler, MouseEventHandler } from 'react';
import styles from './style.module.scss';

type Props = {
  value?: string;
  onChange?: ChangeEventHandler;
  name?: string;
  disabled?: boolean;
  onMax?: MouseEventHandler;
};

function ModalInput({ value, onChange, name, disabled, onMax }: Props) {
  const blockedCharacters = ['e', 'E', '+', '-'];

  return (
    <section className={styles.inputSection}>
      <input
        min={0.0}
        type="number"
        placeholder={'0'}
        value={value}
        onChange={onChange}
        name={name}
        disabled={disabled}
        className={styles.input}
        onKeyDown={(e) => blockedCharacters.includes(e.key) && e.preventDefault()}
        step="any"
        autoFocus
      />
      <p className={styles.translatedValue}>$ {value == '' ? 0 : value}</p>
      {onMax && (
        <p className={styles.max} onClick={onMax}>
          MAX
        </p>
      )}
    </section>
  );
}

export default ModalInput;
