import React, { useContext } from 'react';

import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import LangContext from 'contexts/LangContext';

import styles from './styles.module.scss';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';
import Tooltip from '@mui/material/Tooltip';

function OperationsSelector() {
  const { operation, setOperation } = useContext(ModalStatusContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const actions = {
    variable: [
      {
        value: 'deposit',
        label: translations[lang].deposit,
      },
      {
        value: 'borrow',
        label: translations[lang].borrow,
      },
      {
        value: 'withdraw',
        label: translations[lang].withdraw,
      },
      {
        value: 'repay',
        label: translations[lang].repay,
      },
    ],
    fixed: [
      {
        value: 'depositAtMaturity',
        label: translations[lang].deposit,
      },
      {
        value: 'borrowAtMaturity',
        label: translations[lang].borrow,
      },
      {
        value: 'withdrawAtMaturity',
        label: translations[lang].earlyWithdraw,
      },
      {
        value: 'repayAtMaturity',
        label: translations[lang].earlyRepay,
      },
    ],
  };

  function handleOperation(action: Operation) {
    if (operation !== action) {
      setOperation(action);
    }
  }

  return (
    <section className={styles.operationsSelector}>
      <section className={styles.section}>
        <h3 className={styles.title}>{translations[lang].variableRate}</h3>
        <ul className={styles.list}>
          {actions.variable.map((action) => {
            return (
              <Tooltip
                key={action.value}
                title={
                  action.label === 'Borrow' &&
                  'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard'
                }
                arrow
                placement="top"
                followCursor
              >
                <li
                  key={action.value}
                  onClick={() => handleOperation(action.value as Operation)}
                  className={operation === action.value ? styles.activeAction : styles.action}
                >
                  {action.label}
                </li>
              </Tooltip>
            );
          })}
        </ul>
      </section>
      <section className={styles.section} style={{ marginTop: '50px' }}>
        <h3 className={styles.title}>{translations[lang].fixedRate}</h3>
        <ul className={styles.list}>
          {actions.fixed.map((action) => {
            return (
              <Tooltip
                key={action.value}
                title={
                  action.label === 'Borrow' &&
                  'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard'
                }
                arrow
                placement="top"
                followCursor
              >
                <li
                  key={action.value}
                  onClick={() => handleOperation(action.value as Operation)}
                  className={operation === action.value ? styles.activeAction : styles.action}
                >
                  {action.label}
                </li>
              </Tooltip>
            );
          })}
        </ul>
      </section>
    </section>
  );
}

export default OperationsSelector;
