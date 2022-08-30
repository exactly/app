import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { BigNumber, ethers } from 'ethers';
import { parseFixed, formatFixed } from '@ethersproject/bignumber';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';
import formatNumber from 'utils/formatNumber';

type Props = {
  qty: string;
  symbol: string;
  operation: string;
  line?: boolean;
};

function ModalRowBorrowLimit({ qty, symbol, operation, line }: Props) {
  const { accountData } = useContext(AccountDataContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [newQty, setNewQty] = useState<BigNumber>(ethers.constants.Zero);
  const [beforeBorrowLimit, setBeforeBorrowLimit] = useState<string | undefined>(undefined);
  const [afterBorrowLimit, setAfterBorrowLimit] = useState<string | undefined>(undefined);

  const WAD = parseFixed('1', 18);

  useEffect(() => {
    getBorrowLimits();
  }, [symbol, newQty]);

  function getAmount() {
    if (!accountData || !symbol || !qty) return;

    const decimals = accountData[symbol].decimals;

    const newQty = parseFixed(qty, decimals);

    setNewQty(newQty);
  }

  function getBorrowLimits() {
    if (!accountData) return;

    const oraclePrice = accountData[symbol.toUpperCase()].oraclePrice;
    const decimals = accountData[symbol.toUpperCase()].decimals;
    const maxBorrowAssets = accountData[symbol.toUpperCase()].maxBorrowAssets;
    const adjustFactor = accountData[symbol.toUpperCase()].adjustFactor;
    const isCollateral = accountData[symbol.toUpperCase()].isCollateral;

    const beforeBorrowLimitUSD = maxBorrowAssets.mul(oraclePrice).div(parseFixed('1', decimals));
    const newQtyUsd = newQty.mul(oraclePrice).div(parseFixed('1', decimals));

    setBeforeBorrowLimit(Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2));

    switch (operation) {
      case 'deposit':
        if (isCollateral) {
          const adjustedDepositBorrowLimit = newQtyUsd.mul(adjustFactor).div(WAD);
          setAfterBorrowLimit(
            Number(formatFixed(beforeBorrowLimitUSD.add(adjustedDepositBorrowLimit), 18)).toFixed(2)
          );
        } else {
          setAfterBorrowLimit(Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2));
        }
        break;

      case 'withdraw':
        setAfterBorrowLimit(
          Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2)
        );
        break;

      case 'borrow':
        setAfterBorrowLimit(
          Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2)
        );
        break;

      case 'repay':
        if (isCollateral) {
          const adjustedRepayBorrowLimit = newQtyUsd.mul(adjustFactor).div(WAD);
          setAfterBorrowLimit(
            Number(formatFixed(beforeBorrowLimitUSD.add(adjustedRepayBorrowLimit), 18)).toFixed(2)
          );
        } else {
          setAfterBorrowLimit(Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2));
        }

        break;
    }
  }

  useEffect(() => {
    getAmount();
  }, [symbol, qty]);

  const rowStyles = line ? `${styles.row} ${styles.line}` : styles.row;

  return (
    <section className={rowStyles}>
      <p className={styles.text}>{translations[lang].borrowLimit}</p>
      <section className={styles.values}>
        <span className={styles.value}>
          {beforeBorrowLimit && `$${formatNumber(beforeBorrowLimit, 'usd') || <Skeleton />}`}
        </span>
        <div className={styles.imageContainer}>
          <Image src="/img/icons/arrowRight.svg" alt="arrowRight" layout="fill" />
        </div>
        <span className={styles.value}>
          {afterBorrowLimit && `$${formatNumber(afterBorrowLimit, 'usd') || <Skeleton />}`}
        </span>
      </section>
    </section>
  );
}

export default ModalRowBorrowLimit;
