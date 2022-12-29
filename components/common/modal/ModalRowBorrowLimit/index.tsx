import React, { useContext, useMemo } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { parseFixed, formatFixed } from '@ethersproject/bignumber';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import { checkPrecision } from 'utils/utils';

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
    if (!accountData || !symbol) return;

    if (!qty) return Zero;

    const { decimals } = accountData[symbol];

    if (!checkPrecision(qty, decimals)) return;

    return parseFixed(qty, decimals);
  }, [accountData, symbol, qty]);

  const [beforeBorrowLimit, afterBorrowLimit] = useMemo(() => {
    if (!accountData || !newQty) return [undefined, undefined];

    const { usdPrice, decimals, adjustFactor, isCollateral } = accountData[symbol];

    const beforeBorrowLimitUSD = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, operation);

    const newQtyUsd = newQty.mul(usdPrice).div(parseFixed('1', decimals));

    const newBeforeBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
    let newAfterBorrowLimit = newBeforeBorrowLimit;

    switch (operation) {
      case 'deposit':
        if (isCollateral) {
          const adjustedDepositBorrowLimit = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.add(adjustedDepositBorrowLimit), 18)).toFixed(
            2,
          );
        } else {
          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        }
        break;

      case 'withdraw':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'borrow':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'repay':
        if (isCollateral) {
          const adjustedRepayBorrowLimit = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.add(adjustedRepayBorrowLimit), 18)).toFixed(2);
        } else {
          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        }
        break;
    }

    return [newBeforeBorrowLimit, newAfterBorrowLimit];
  }, [accountData, symbol, newQty, operation]);

  return (
    <section className={line ? `${styles.row} ${styles.line}` : styles.row}>
      <p className={styles.text}>{translations[lang].borrowLimit}</p>
      <section className={styles.values}>
        <span className={styles.value}>
          {beforeBorrowLimit && `$${formatNumber(beforeBorrowLimit, 'usd') || <Skeleton />}`}
        </span>
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
          {afterBorrowLimit && `$${formatNumber(afterBorrowLimit, 'usd') || <Skeleton />}`}
        </span>
      </section>
    </section>
  );
}

export default ModalRowBorrowLimit;
