import { useContext, useMemo } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { constants } from 'ethers';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import parseHealthFactor from 'utils/parseHealthFactor';
import getHealthFactorData from 'utils/getHealthFactorData';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  qty: string;
  symbol: string;
  operation: string;
  healthFactorCallback?: (healthFactor: HealthFactor) => void;
};

function ModalRowHealthFactor({ qty, symbol, operation, healthFactorCallback }: Props) {
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);
  const WAD = parseFixed('1', 18);

  const translations: { [key: string]: LangKeys } = keys;

  const newQty = useMemo(() => {
    return getAmount();
  }, [symbol, qty]);

  const {
    beforeHealthFactor,
    healthFactor,
  }:
    | { beforeHealthFactor: undefined; healthFactor: undefined }
    | { beforeHealthFactor: string; healthFactor: HealthFactor } = useMemo(() => {
    return getBeforeHealthFactor();
  }, [accountData]);

  const afterHealthFactor = useMemo(() => {
    return calculateAfterHealthFactor();
  }, [healthFactor, newQty, accountData]);

  function getAmount() {
    if (!accountData || !symbol) return;

    if (qty == '') {
      return constants.Zero;
    }
    const decimals = accountData[symbol].decimals;

    const regex = /[^,.]*$/g;
    const inputDecimals = regex.exec(qty)![0];

    if (inputDecimals.length > decimals) return;

    const newQty = parseFixed(qty, decimals);

    return newQty;
  }

  function getBeforeHealthFactor() {
    if (!accountData) return { beforeHealthFactor: undefined, healthFactor: undefined };

    const healthFactor: HealthFactor = getHealthFactorData(accountData);

    if (healthFactor) {
      if (healthFactorCallback) healthFactorCallback(healthFactor);

      return {
        beforeHealthFactor: parseHealthFactor(healthFactor.debt, healthFactor.collateral),
        healthFactor: healthFactor,
      };
    }

    return { beforeHealthFactor: undefined, healthFactor: undefined };
  }

  function calculateAfterHealthFactor() {
    if (!accountData || !newQty || !healthFactor) return;

    const adjustFactor = accountData[symbol].adjustFactor;
    const usdPrice = accountData[symbol].usdPrice;
    const isCollateral = accountData[symbol].isCollateral;
    const decimals = accountData[symbol].decimals;

    const newQtyUsd = newQty.mul(usdPrice).div(parseFixed('1', decimals));

    switch (operation) {
      case 'deposit': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WAD);

          return parseHealthFactor(healthFactor!.debt, healthFactor!.collateral.add(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor!.debt, healthFactor!.collateral);
        }
      }
      case 'withdraw': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(WAD).div(adjustFactor);

          return parseHealthFactor(healthFactor!.debt, healthFactor!.collateral.sub(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor!.debt, healthFactor!.collateral);
        }
      }
      case 'borrow': {
        const adjustedNewQtyUsd = newQtyUsd.mul(WAD).div(adjustFactor);

        return parseHealthFactor(healthFactor!.debt.add(adjustedNewQtyUsd), healthFactor!.collateral);
      }
      case 'repay': {
        const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WAD);

        return parseHealthFactor(healthFactor!.debt, healthFactor!.collateral.add(adjustedNewQtyUsd));
      }
    }
  }

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].healthFactor}</p>
      <section className={styles.values}>
        <span className={styles.value}>{(symbol && beforeHealthFactor) || <Skeleton />}</span>
        <Image src="/img/icons/arrowRight.svg" alt="arrowRight" width={15} height={15} />
        <span className={styles.value}>
          {(symbol && afterHealthFactor ? afterHealthFactor : beforeHealthFactor) || <Skeleton />}
        </span>
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
