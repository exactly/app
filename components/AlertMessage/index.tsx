import style from "./style.module.scss";

type Props = {
  label: string;
  status?: string;
};

function AlertMessage({ label, status }: Props) {
  return (
    <div
      className={`${style.alertContainer} ${status ? style[status] : ""}`}
      dangerouslySetInnerHTML={{ __html: label }}
    ></div>
  );
}

export default AlertMessage;
