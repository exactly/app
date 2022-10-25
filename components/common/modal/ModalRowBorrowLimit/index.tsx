import { useContext, useMemo } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { constants } from 'ethers';
import { parseFixed, formatFixed } from '@ethersproject/bignumber';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';

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

  const newQty = useMemo(() => {
    return getAmount();
  }, [accountData, symbol, qty]);

  const [beforeBorrowLimit, afterBorrowLimit] = useMemo(() => {
    return getBorrowLimits();
  }, [accountData, symbol, newQty, operation]);

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

  function getBorrowLimits() {
    if (!accountData || !newQty) return [undefined, undefined];

    const usdPrice = accountData[symbol.toUpperCase()].usdPrice;
    const decimals = accountData[symbol.toUpperCase()].decimals;
    const adjustFactor = accountData[symbol.toUpperCase()].adjustFactor;
    const isCollateral = accountData[symbol.toUpperCase()].isCollateral;

    const WAD = parseFixed('1', 18);

    const beforeBorrowLimitUSD = getBeforeBorrowLimit(
      accountData,
      symbol,
      usdPrice,
      decimals,
      operation
    );

    const newQtyUsd = newQty.mul(usdPrice).div(parseFixed('1', decimals));

    const beforeBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
    let afterBorrowLimit = beforeBorrowLimit;

    switch (operation) {
      case 'deposit':
        if (isCollateral) {
          const adjustedDepositBorrowLimit = newQtyUsd.mul(adjustFactor).div(WAD);

          afterBorrowLimit = Number(
            formatFixed(beforeBorrowLimitUSD.add(adjustedDepositBorrowLimit), 18)
          ).toFixed(2);
        } else {
          afterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        }
        break;

      case 'withdraw':
        afterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'borrow':
        afterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'repay':
        if (isCollateral) {
          const adjustedRepayBorrowLimit = newQtyUsd.mul(adjustFactor).div(WAD);

          afterBorrowLimit = Number(
            formatFixed(beforeBorrowLimitUSD.add(adjustedRepayBorrowLimit), 18)
          ).toFixed(2);
        } else {
          afterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        }
        break;
    }

    return [beforeBorrowLimit, afterBorrowLimit];
  }

  return (
    <section className={line ? `${styles.row} ${styles.line}` : styles.row}>
      <p className={styles.text}>{translations[lang].borrowLimit}</p>
      <section className={styles.values}>
        <span className={styles.value}>
          {beforeBorrowLimit && `$${formatNumber(beforeBorrowLimit, 'usd') || <Skeleton />}`}
        </span>
        <Image src="/img/icons/arrowRight.svg" alt="arrowRight" width={15} height={15} />
        <span className={styles.value}>
          {afterBorrowLimit && `$${formatNumber(afterBorrowLimit, 'usd') || <Skeleton />}`}
        </span>
      </section>
    </section>
  );
}

export default ModalRowBorrowLimit;
