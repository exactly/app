import type { Contract } from '@ethersproject/contracts';
import type { BigNumber } from '@ethersproject/bignumber';
import React, { useContext, useEffect, useState } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import Skeleton from 'react-loading-skeleton';
import Image from 'next/image';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/SmartPoolDashboardTable/SwitchCollateral';

type Props = {
  symbol: string | undefined;
  depositAmount: BigNumber | undefined;
  borrowedAmount: BigNumber | undefined;
  walletAddress: string | null | undefined;
  eTokenAmount: BigNumber | undefined;
  auditorContract: Contract | undefined;
  type: Option | undefined;
  market: string | undefined;
};

function Item({
  symbol,
  depositAmount,
  borrowedAmount,
  walletAddress,
  eTokenAmount,
  auditorContract,
  type,
  market,
}: Props) {
  const { accountData } = useContext(AccountDataContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [rate, setRate] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (accountData) {
      getExchangeRate();
    }
  }, [accountData, walletAddress]);

  function getExchangeRate() {
    if (!accountData || !symbol) return;
    const data = accountData;
    const exchangeRate = parseFloat(formatFixed(data[symbol].usdPrice, 18));
    setRate(exchangeRate);
  }

  return (
    <div className={styles.container}>
      <Link href={`/assets/${symbol}`}>
        <div className={styles.symbol}>
          {(symbol && <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={20} height={20} />) || (
            <Skeleton circle height={20} width={20} />
          )}
          <div className={styles.primary}>{(symbol && formatSymbol(symbol)) || <Skeleton />}</div>
        </div>
      </Link>
      <div className={styles.value}>
        {(depositAmount &&
          borrowedAmount &&
          symbol &&
          rate &&
          `$${formatNumber(
            parseFloat(
              formatFixed(type?.value === 'deposit' ? depositAmount : borrowedAmount, accountData?.[symbol].decimals),
            ) * rate,
            'USD',
            true,
          )}`) || <Skeleton width={40} />}
      </div>

      {type?.value === 'deposit' && (
        <div className={styles.value}>
          {(eTokenAmount &&
            symbol &&
            `${formatNumber(formatFixed(eTokenAmount, accountData?.[symbol].decimals), symbol)}`) || (
              <Skeleton width={40} />
            )}{' '}
        </div>
      )}

      {/* <div className={styles.value}>{(difference && difference) || <Skeleton width={40} />}</div> */}

      {type?.value === 'deposit' && (
        <SwitchCollateral symbol={symbol} walletAddress={walletAddress} auditorContract={auditorContract} />
      )}

      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          {(symbol && type && (
            <Button
              text={type.value === 'deposit' ? translations[lang].deposit : translations[lang].borrow}
              className={'primary'}
              onClick={() => {
                setMarket({ value: market! });
                setOperation(type.value as Operation);
                setOpen(true);
              }}
            />
          )) || <Skeleton height={40} />}
        </div>

        <div className={styles.buttonContainer}>
          {(symbol && type && (
            <Button
              text={type.value === 'deposit' ? translations[lang].withdraw : translations[lang].repay}
              className={'tertiary'}
              onClick={() => {
                setMarket({ value: market! });
                setOperation(type.value === 'deposit' ? 'withdraw' : 'repay');
                setOpen(true);
              }}
            />
          )) || <Skeleton height={40} />}
        </div>
      </div>
    </div>
  );
}

export default Item;
