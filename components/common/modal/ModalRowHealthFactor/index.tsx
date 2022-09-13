import { useContext, useEffect, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { BigNumber, ethers } from 'ethers';

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

  const [newQty, setNewQty] = useState<BigNumber | undefined>(undefined);

  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);

  const [beforeHealthFactor, setBeforeHealthFactor] = useState<string | undefined>(undefined);
  const [afterHealthFactor, setAfterHealthFactor] = useState<string | undefined>(undefined);

  useEffect(() => {
    getAmount();
  }, [symbol, qty]);

  useEffect(() => {
    getHealthFactor();
    calculateAfterHealthFactor();
  }, [symbol, newQty, accountData]);

  function getAmount() {
    if (!accountData || !symbol) return;

    if (qty == '') {
      return setNewQty(ethers.constants.Zero);
    }
    const decimals = accountData[symbol].decimals;

    const regex = /[^,.]*$/g;
    const inputDecimals = regex.exec(qty)![0];

    if (inputDecimals.length > decimals) return;

    const newQty = parseFixed(qty, decimals);

    setNewQty(newQty);
  }

  function getHealthFactor() {
    if (!accountData) return;

    const healthFactor = getHealthFactorData(accountData);

    if (healthFactor) {
      setHealthFactor(healthFactor);

      setBeforeHealthFactor(parseHealthFactor(healthFactor.debt, healthFactor.collateral));
      setAfterHealthFactor(parseHealthFactor(healthFactor.debt, healthFactor.collateral));
    }

    if (healthFactorCallback && healthFactor) healthFactorCallback(healthFactor);
  }

  function calculateAfterHealthFactor() {
    if (!accountData || !newQty) return;

    const adjustFactor = accountData[symbol].adjustFactor;
    const oraclePrice = accountData[symbol].oraclePrice;
    const isCollateral = accountData[symbol].isCollateral;
    const decimals = accountData[symbol].decimals;

    const newQtyUsd = newQty.mul(oraclePrice).div(parseFixed('1', decimals));

    switch (operation) {
      case 'deposit': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WAD);

          setAfterHealthFactor(
            parseHealthFactor(healthFactor!.debt, healthFactor!.collateral.add(adjustedNewQtyUsd))
          );
        } else {
          setAfterHealthFactor(parseHealthFactor(healthFactor!.debt, healthFactor!.collateral));
        }

        break;
      }
      case 'withdraw': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(WAD).div(adjustFactor);

          setAfterHealthFactor(
            parseHealthFactor(healthFactor!.debt, healthFactor!.collateral.sub(adjustedNewQtyUsd))
          );
        } else {
          setAfterHealthFactor(parseHealthFactor(healthFactor!.debt, healthFactor!.collateral));
        }

        break;
      }
      case 'borrow': {
        const adjustedNewQtyUsd = newQtyUsd.mul(WAD).div(adjustFactor);

        setAfterHealthFactor(
          parseHealthFactor(healthFactor!.debt.add(adjustedNewQtyUsd), healthFactor!.collateral)
        );

        break;
      }
      case 'repay': {
        const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WAD);

        setAfterHealthFactor(
          parseHealthFactor(healthFactor!.debt, healthFactor!.collateral.add(adjustedNewQtyUsd))
        );
        break;
      }
    }
  }

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].healthFactor}</p>
      <section className={styles.values}>
        <span className={styles.value}>{(symbol && beforeHealthFactor) || <Skeleton />}</span>
        <Image src="/img/icons/arrowRight.svg" alt="arrowRight" width={20} height={20} />
        <span className={styles.value}>{(symbol && afterHealthFactor) || <Skeleton />}</span>
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
