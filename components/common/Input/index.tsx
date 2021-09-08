import { ChangeEventHandler, CSSProperties } from "react";
import styles from "./style.module.scss";

type Props = {
  type?: string;
  className?: string;
  onChange?: ChangeEventHandler;
  placeholder?: string;
  value?: string;
  name?: string;
  style?: CSSProperties;
  disabled?: boolean;
};

function Input({
  type = "text",
  className = "",
  onChange,
  placeholder,
  value,
  name,
  style,
  disabled,
}: Props) {
  return (
    <input
      className={`${styles.input} ${className}`}
      type={type}
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      disabled={disabled}
    />
  );
}

export default Input;
