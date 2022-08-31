import { useContext } from 'react';

import ModalStatusContext from 'contexts/ModalStatusContext';

import styles from './styles.module.scss';

function OperationsSelector() {
  const { operation, setOperation } = useContext(ModalStatusContext);

  const actions = {
    variable: [
      {
        value: 'deposit',
        label: 'Deposit'
      },
      {
        value: 'borrow',
        label: 'Borrow'
      },
      {
        value: 'withdraw',
        label: 'Withdraw'
      },
      {
        value: 'repay',
        label: 'Repay'
      }
    ],
    fixed: [
      {
        value: 'depositAtMaturity',
        label: 'Deposit'
      },
      {
        value: 'borrowAtMaturity',
        label: 'Borrow'
      },
      {
        value: 'withdrawAtMaturity',
        label: 'Withdraw'
      },
      {
        value: 'repayAtMaturity',
        label: 'Repay'
      }
    ]
  };

  function handleOperation(action: any) {
    if (operation != action) {
      setOperation(action);
    }
  }

  return (
    <section className={styles.operationsSelector}>
      <section className={styles.section}>
        <h3 className={styles.title}>Fixed</h3>
        <ul className={styles.list}>
          {actions.fixed.map((action) => {
            return (
              <li
                key={action.value}
                onClick={() => handleOperation(action.value)}
                className={operation == action.value ? styles.activeAction : styles.action}
              >
                {action.label}
              </li>
            );
          })}
        </ul>
      </section>
      <section className={styles.section}>
        <h3 className={styles.title}>Variable</h3>
        <ul className={styles.list}>
          {actions.variable.map((action) => {
            return (
              <li
                key={action.value}
                onClick={() => handleOperation(action.value)}
                className={operation == action.value ? styles.activeAction : styles.action}
              >
                {action.label}
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}

export default OperationsSelector;
