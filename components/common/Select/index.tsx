import { ChangeEventHandler, CSSProperties } from "react";
import styles from "./style.module.scss";
import dayjs from "dayjs";
import dictionary from "dictionary/en.json";

type Props = {
  className?: string;
  onChange?: ChangeEventHandler;
  onClick?: any;
  placeholder?: string;
  value?: string;
  name?: string;
  style?: CSSProperties;
  disabled?: boolean;
  options: Array<string>;
};

function Select({
  className = "",
  onChange,
  onClick,
  placeholder,
  value,
  name,
  style,
  disabled,
  options
}: Props) {
  return (
    <select
      className={`${styles.select} ${className}`}
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      disabled={disabled}
      defaultValue={1}
      onClick={onClick}
    >
      <option value={1} disabled hidden>
        {dictionary.selectDefaultText}
      </option>
      {options.map((option: string) => {
        return (
          <option value={option} key={option} className={styles.option}>
            {dayjs.unix(parseInt(option)).format("DD/MM/YYYY")}
          </option>
        );
      })}
    </select>
  );
}

export default Select;
