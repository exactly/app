import { useContext, useEffect, useState } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { utils } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('components/common/Button'));
import Tooltip from 'components/Tooltip';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';
import { FixedMarketData } from 'types/FixedMarketData';

import { MarketContext } from 'contexts/AddressContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import style from './style.module.scss';

import keys from './translations.json';
import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';

type Props = {
  market?: Market;
  fixedMarketData?: FixedMarketData[];
  type?: 'borrow' | 'deposit';
};

function Item({ market, type, fixedMarketData }: Props) {
  const { date } = useContext(MarketContext);
  const { walletAddress, connect, network } = useWeb3Context();

  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [rate, setRate] = useState<string | undefined>(undefined);

  useEffect(() => {
    getMarketData();
  }, [date, network, market, accountData, fixedMarketData]);

  function handleClick() {
    if (!market || !type) return;

    if (!walletAddress && connect) return connect();

    setOperation(type == 'borrow' ? 'borrowAtMaturity' : 'depositAtMaturity');
    setMarket({ value: market.market });
    setOpen(true);
  }

  async function getMarketData() {
    if (!market || !accountData) return;

    setPoolData(undefined);
    setRate(undefined);

    try {
      const pool = accountData[market?.symbol.toUpperCase()].fixedPools.find((pool) => {
        return pool.maturity.toString() == date?.value;
      });

      const decimals = accountData[market?.symbol.toUpperCase()].decimals;

      if (!pool) {
        return;
      }

      const exchangeRate = parseFloat(
        utils.formatEther(accountData[market?.symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: parseFloat(await utils.formatUnits(pool.borrowed, decimals)),
        supplied: parseFloat(await utils.formatUnits(pool.supplied, decimals)),
        rate: exchangeRate
      };

      setPoolData(newPoolData);
    } catch (e) {
      console.log(e);
    }

    try {
      const fixedMarket = fixedMarketData?.find((element) => element.market == market.market);

      if (type == 'borrow') {
        const pool = fixedMarket?.borrows.find((pool) => pool.maturity.toString() == date?.value);
        if (!fixedMarket || !pool) return;

        const initialAssets = fixedMarket.assets;
        const finalAssets = pool.assets;

        const borrowRate = finalAssets.mul(parseFixed('1', 18)).div(initialAssets);
        const borrowTimestamp = new Date().getTime() / 1_000;

        const time = 31_536_000 / (parseInt(date?.value!) - borrowTimestamp);

        const borrowFixedAPY = (Number(formatFixed(borrowRate, 18)) ** time - 1) * 100;

        if (borrowFixedAPY <= 0.01) {
          setRate('N/A');
        } else {
          setRate(`${borrowFixedAPY.toFixed(2)}%`);
        }
      } else if (type == 'deposit') {
        const pool = fixedMarket?.deposits.find((pool) => pool.maturity.toString() == date?.value);
        if (!fixedMarket || !pool) return;

        const initialAssets = fixedMarket.assets;
        const finalAssets = pool.assets;

        const depositRate = finalAssets.mul(parseFixed('1', 18)).div(initialAssets);
        const depositTimestamp = new Date().getTime() / 1_000;

        const time = 31_536_000 / (parseInt(date?.value!) - depositTimestamp);

        const depositFixedAPY = (Number(formatFixed(depositRate, 18)) ** time - 1) * 100;

        if (depositFixedAPY <= 0.01) {
          setRate('N/A');
        } else {
          setRate(`${depositFixedAPY.toFixed(2)}%`);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div
      className={`${style.container} ${
        type == 'borrow' ? style.secondaryContainer : style.primaryContainer
      }`}
    >
      <Link href={`/assets/${market?.symbol == 'WETH' ? 'eth' : market?.symbol.toLowerCase()}`}>
        <div className={style.symbol}>
          {(market && (
            <Image
              src={`/img/assets/${market?.symbol.toLowerCase()}.svg`}
              alt={market?.symbol}
              width={40}
              height={40}
            />
          )) || <Skeleton circle width={40} height={40} />}
          <span className={style.primary}>
            {(market && parseSymbol(market?.symbol)) || <Skeleton width={30} />}
          </span>
        </div>
      </Link>
      <div className={style.value}>
        {poolData && market ? (
          type == 'borrow' ? (
            `$${formatNumber(poolData?.borrowed! * poolData?.rate!, 'USD')}`
          ) : (
            `$${formatNumber(poolData?.supplied! * poolData?.rate!, 'USD')}`
          )
        ) : (
          <Skeleton />
        )}
      </div>
      <div className={style.value}>
        {rate || <Skeleton />} {rate == 'N/A' && <Tooltip value={translations[lang].noRate} />}
      </div>
      <div className={style.buttonContainer}>
        {(market && (
          <Button
            text={type == 'borrow' ? translations[lang].borrow : translations[lang].deposit}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={type == 'borrow' ? 'secondary' : 'primary'}
          />
        )) || <Skeleton height={40} />}
      </div>
    </div>
  );
}

export default Item;
