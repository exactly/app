import { useEffect, useContext } from 'react';

import { AlertContext } from 'contexts/AlertContext';

import styles from './style.module.scss';

import { Alert } from 'types/Alert';

type Props = {
  alert: Alert;
};

function ToastNotification({ alert }: Props) {
  const { setAlert } = useContext(AlertContext);

  useEffect(() => {
    const interval = setTimeout(() => {
      setAlert(undefined);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function handleClick() {
    setAlert(undefined);
  }

  return (
    <>
      {alert?.code && (
        <div
          className={styles.toast}
          style={{ background: `var(--${alert.type})` }}
        >
          <span onClick={handleClick} className={styles.close}>
            x
          </span>
          <p className={styles.message}>{alert?.code}</p>
        </div>
      )}
    </>
  );
}

export default ToastNotification;
