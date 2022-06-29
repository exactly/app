import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import parseHealthFactor from 'utils/parseHealthFactor';

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

  const translations: { [key: string]: LangKeys } = keys;

  const [newQty, setNewQty] = useState<number | undefined>(undefined);

  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);

  const beforeHealthFactor =
    healthFactor && parseHealthFactor(healthFactor!.debt, healthFactor!.collateral);

  let afterHealthFactor = beforeHealthFactor;

  useEffect(() => {
    getHealthFactor();
    getAmount();
  }, [symbol, qty]);

  function getHealthFactor() {
    if (!accountData) return;

    let collateral = 0;
    let debt = 0;

    const data = Object.values(accountData!);

    data.forEach((fixedLender: FixedLenderAccountData) => {
      const decimals = fixedLender.decimals;

      if (fixedLender.isCollateral) {
        const assets = parseFloat(ethers.utils.formatUnits(fixedLender.smartPoolAssets, decimals));
        const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));
        const collateralFactor = parseFloat(ethers.utils.formatUnits(fixedLender.adjustFactor, 18));

        collateral += assets * oracle * collateralFactor;
      }

      fixedLender.maturityBorrowPositions.forEach((borrowPosition) => {
        const penaltyRate = parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, 18));
        const principal = parseFloat(
          ethers.utils.formatUnits(borrowPosition.position.principal, decimals)
        );
        const fee = parseFloat(ethers.utils.formatUnits(borrowPosition.position.fee, decimals));
        const maturityTimestamp = borrowPosition.maturity.toNumber();
        const currentTimestamp = new Date().getTime() / 1000;

        debt += principal + fee;
        if (maturityTimestamp > currentTimestamp) {
          debt += (currentTimestamp - maturityTimestamp) * penaltyRate;
        }
      });
    });

    const healthFactor = { collateral, debt };

    setHealthFactor(healthFactor);

    if (healthFactorCallback) healthFactorCallback(healthFactor);
  }

  async function getAmount() {
    if (!accountData || !symbol) return;

    const exchangeRate = parseFloat(ethers.utils.formatEther(accountData[symbol].oraclePrice));

    const newQty = exchangeRate * parseFloat(qty);

    setNewQty(newQty);
  }

  switch (operation) {
    case 'deposit':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor!.debt, healthFactor!.collateral + (newQty || 0));
      break;
    case 'withdraw':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor!.debt, healthFactor!.collateral - (newQty || 0));
      break;
    case 'borrow':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor!.debt + (newQty || 0), healthFactor!.collateral);
      break;
    case 'repay':
      afterHealthFactor =
        healthFactor &&
        parseHealthFactor(healthFactor!.debt - (newQty || 0), healthFactor!.collateral);
      break;
  }

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].healthFactor}</p>
      <section className={styles.values}>
        <span className={styles.value}>{(symbol && beforeHealthFactor) || <Skeleton />}</span>
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <span className={styles.value}>{(symbol && afterHealthFactor) || <Skeleton />}</span>
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
