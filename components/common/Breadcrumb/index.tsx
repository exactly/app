import Link from "next/link";
import { Step } from "types/Step";
import style from "./style.module.scss";

type Props = {
  steps: Array<Step>;
};
function Breadcrumb({ steps }: Props) {
  return (
    <ul className={style.container}>
      <Link href="/">
        <li>Markets</li>
      </Link>

      {steps.map((step: Step, key) => {
        return (
          <Link href={step.url} key={key}>
            <li>{step.value}</li>
          </Link>
        );
      })}
    </ul>
  );
}

export default Breadcrumb;
