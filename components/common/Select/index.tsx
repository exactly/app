import { ChangeEventHandler, CSSProperties } from "react";
import styles from "./style.module.scss";
import dayjs from "dayjs";
import dictionary from "dictionary/en.json";

type Props = {
  className?: string;
  onChange?: ChangeEventHandler;
  placeholder?: string;
  value?: string;
  name?: string;
  style?: CSSProperties;
  disabled?: boolean;
  options: Array<number>;
};

function Select({
  className = "",
  onChange,
  placeholder,
  value,
  name,
  style,
  disabled,
  options
}: Props) {
  return (
    <select
      className={`${styles.input} ${className}`}
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      disabled={disabled}
      defaultValue={1}
    >
      <option value={1} disabled hidden>
        {dictionary.selectDefaultText}
      </option>
      {options.map((option: number) => {
        return (
          <option value={option} key={option}>
            {dayjs.unix(option).format("DD/MM/YYYY")}
          </option>
        );
      })}
    </select>
  );
}

export default Select;
