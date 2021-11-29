import ReactTooltip, { Place } from 'react-tooltip';

import styles from './style.module.scss';

type Props = {
  id: string;
  text: string;
  position?: Place;
};

function Tooltip({ text, id, position }: Props) {
  return (
    <>
      <a data-tip data-for={id} className={styles.tooltipAction}>
        <img src="/img/icons/info.svg" alt="tooltip" />
      </a>
      <ReactTooltip
        id={id}
        place={position || 'top'}
        className={styles.tooltip}
      >
        <span>{text}</span>
      </ReactTooltip>
    </>
  );
}

export default Tooltip;
