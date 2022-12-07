import React, { useContext, useMemo } from 'react';
import Tooltip from '@mui/material/Tooltip';

import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import LangContext from 'contexts/LangContext';

import styles from './styles.module.scss';

import { LangKeys } from 'types/Lang';

import keys from './translations.json';

function OperationsSelector() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { operation, openOperationModal } = useModalStatus();

  const actions = useMemo<{
    [k in 'variable' | 'fixed']: { value: Operation; label: string; tooltipTitle?: string }[];
  }>(
    () => ({
      variable: [
        {
          value: 'deposit',
          label: translations[lang].deposit,
        },
        {
          value: 'borrow',
          label: translations[lang].borrow,
          tooltipTitle:
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
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
          tooltipTitle:
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
        },
        {
          value: 'withdrawAtMaturity',
          label: translations[lang].earlyWithdraw,
          tooltipTitle: 'Subject to market conditions of liquidity and interest rates at the transaction',
        },
        {
          value: 'repayAtMaturity',
          label: translations[lang].earlyRepay,
          tooltipTitle: 'Subject to market conditions of liquidity and interest rates at the transaction',
        },
      ],
    }),
    [translations, lang],
  );

  return (
    <section className={styles.operationsSelector}>
      <section className={styles.section}>
        <h3 className={styles.title}>{translations[lang].variableRate}</h3>
        <ul className={styles.list}>
          {actions.variable.map((action) => {
            return (
              <Tooltip key={action.value} title={action.tooltipTitle} arrow placement="top" followCursor>
                <li
                  key={action.value}
                  onClick={() => openOperationModal(action.value)}
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
              <Tooltip key={action.value} title={action.tooltipTitle} arrow placement="top" followCursor>
                <li
                  key={action.value}
                  onClick={() => openOperationModal(action.value)}
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
