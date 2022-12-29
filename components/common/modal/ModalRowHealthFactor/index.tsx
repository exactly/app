import React, { useContext, useMemo } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import parseHealthFactor from 'utils/parseHealthFactor';
import getHealthFactorData from 'utils/getHealthFactorData';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';
import { checkPrecision } from 'utils/utils';

type Props = {
  qty: string;
  symbol: string;
  operation: string;
};

function ModalRowHealthFactor({ qty, symbol, operation }: Props) {
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);

  const translations: { [key: string]: LangKeys } = keys;

  const newQty = useMemo(() => {
    if (!accountData || !symbol) return;

    if (!qty) return Zero;

    const { decimals } = accountData[symbol];

    if (!checkPrecision(qty, decimals)) return;

    return parseFixed(qty, decimals);
  }, [accountData, symbol, qty]);

  const {
    beforeHealthFactor,
    healthFactor,
  }:
    | { beforeHealthFactor: undefined; healthFactor: undefined }
    | { beforeHealthFactor: string; healthFactor: HealthFactor } = useMemo(() => {
    if (!accountData) return {};

    const hf: HealthFactor = getHealthFactorData(accountData);

    return {
      beforeHealthFactor: parseHealthFactor(hf.debt, hf.collateral),
      healthFactor: hf,
    };
  }, [accountData]);

  const afterHealthFactor = useMemo(() => {
    if (!accountData || !newQty || !healthFactor) return;

    const { adjustFactor, usdPrice, isCollateral, decimals } = accountData[symbol];

    const newQtyUsd = newQty.mul(usdPrice).div(parseFixed('1', decimals));

    switch (operation) {
      case 'deposit': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral.add(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }
      case 'withdraw': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(WeiPerEther).div(adjustFactor);

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }
      case 'borrow': {
        const adjustedNewQtyUsd = newQtyUsd.mul(WeiPerEther).div(adjustFactor);

        return parseHealthFactor(healthFactor.debt.add(adjustedNewQtyUsd), healthFactor.collateral);
      }
      case 'repay': {
        const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

        return parseHealthFactor(healthFactor.debt, healthFactor.collateral.add(adjustedNewQtyUsd));
      }
    }
  }, [healthFactor, newQty, accountData, operation, symbol]);

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].healthFactor}</p>
      <section className={styles.values}>
        <span className={styles.value}>{(symbol && beforeHealthFactor) || <Skeleton />}</span>
        <Image
          src="/img/icons/arrowRight.svg"
          alt="arrowRight"
          width={15}
          height={15}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <span className={styles.value}>
          {(symbol && afterHealthFactor ? afterHealthFactor : beforeHealthFactor) || <Skeleton />}
        </span>
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
