import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import parseHealthFactor from 'utils/parseHealthFactor';
import parseSymbol from 'utils/parseSymbol';
import getExchangeRate from 'utils/getExchangeRate';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';
import { ethers } from 'ethers';

type Props = {
  qty: string;
  symbol: string;
  operation: string;
};

function ModalRowHealthFactor({ qty, symbol, operation }: Props) {
  const lang: string = useContext(LangContext);
  const { accountData } = useContext(AccountDataContext);
  const translations: { [key: string]: LangKeys } = keys;
  const parsedSymbol = parseSymbol(symbol);

  const [newQty, setNewQty] = useState<number | undefined>(undefined);

  const [healthFactor, setHealthFactor] = useState<HealthFactor>({ collateral: 0, debt: 0 });

  const [loading, setLoading] = useState<boolean>(true);

  const beforeHealthFactor =
    accountData && parseHealthFactor(healthFactor.debt, healthFactor.collateral);

  let afterHealthFactor = beforeHealthFactor;

  useEffect(() => {
    getHealthFactor();
    getAmount();
  }, [symbol, qty]);

  function getHealthFactor() {
    const data = Object.values(accountData!);

    let collateral = 0;
    let debt = 0;

    for (let i = 0; i < data.length; i++) {
      const fixedLender = data[i];
      const decimals = fixedLender.decimals;

      if (fixedLender.isCollateral) {
        const assets = parseFloat(ethers.utils.formatUnits(fixedLender.smartPoolAssets, decimals));
        const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));
        const collateralFactor = parseFloat(
          ethers.utils.formatUnits(fixedLender.collateralFactor, decimals)
        );

        collateral += assets * oracle * collateralFactor;
      }

      for (let j = 0; j < fixedLender.maturityBorrowPositions.length; j++) {
        parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, decimals));
        const borrow = fixedLender.maturityBorrowPositions[j];
        const penaltyRate = parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, 18));
        const principal = parseFloat(ethers.utils.formatUnits(borrow.position.principal, decimals));
        const fee = parseFloat(ethers.utils.formatUnits(borrow.position.fee, decimals));
        const maturityTimestamp = borrow.maturity.toNumber();
        const currentTimestamp = new Date().getTime() / 1000;

        debt += principal + fee;
        if (maturityTimestamp > currentTimestamp) {
          debt += (currentTimestamp - maturityTimestamp) * penaltyRate;
        }
      }
    }

    const healthFactor = { collateral, debt };

    setHealthFactor(healthFactor);
    setLoading(false);
  }

  async function getAmount() {
    let exchangeRate = 1;

    if (
      parsedSymbol &&
      parsedSymbol.toLowerCase() !== 'dai' &&
      parsedSymbol.toLowerCase() !== 'usdc'
    ) {
      exchangeRate = await getExchangeRate(parsedSymbol);
    }

    const newQty = exchangeRate * parseFloat(qty);

    setNewQty(newQty);
  }

  switch (operation) {
    case 'deposit':
      afterHealthFactor = parseHealthFactor(
        healthFactor.debt,
        healthFactor.collateral + (newQty || 0)
      );
      break;
    case 'withdraw':
      afterHealthFactor = parseHealthFactor(
        healthFactor.debt,
        healthFactor.collateral - (newQty || 0)
      );
      break;
    case 'borrow':
      afterHealthFactor = parseHealthFactor(
        healthFactor.debt + (newQty || 0),
        healthFactor.collateral
      );
      break;
    case 'repay':
      afterHealthFactor = parseHealthFactor(
        healthFactor.debt - (newQty || 0),
        healthFactor.collateral
      );
      break;
  }

  return (
    <section className={`${styles.row} ${styles.line}`}>
      <p className={styles.text}>{translations[lang].healthFactor}</p>
      <section className={styles.values}>
        {loading ? (
          <Skeleton width={40} />
        ) : (
          <span className={styles.value}>{beforeHealthFactor}</span>
        )}
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        {loading ? (
          <Skeleton width={40} />
        ) : (
          <span className={styles.value}>{afterHealthFactor}</span>
        )}
      </section>
    </section>
  );
}

export default ModalRowHealthFactor;
