import { CSSProperties, MouseEventHandler } from "react";
import styles from "./style.module.scss";
import { transformClasses } from "utils/utils";

type Props = {
  text: string;
  onClick?: MouseEventHandler;
  className?: string;
  style?: CSSProperties;
  loading?: boolean;
};

function Button({ text, onClick, className, style, loading }: Props) {
  let parsedClassName = "";

  if (className) {
    parsedClassName = transformClasses(styles, className);
  }
  return (
    <button
      style={style ?? undefined}
      className={`${styles.button} ${parsedClassName}`}
      onClick={onClick}
    >
      {loading ? "Loading" : text}
    </button>
  );
}

export default Button;
