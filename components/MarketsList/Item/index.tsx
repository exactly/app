import { useContext, useEffect, useState } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';

import Button from 'components/common/Button';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';
import { FixedMarketData } from 'types/FixedMarketData';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import style from './style.module.scss';

import keys from './translations.json';
import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';

type Props = {
  market?: Market;
  fixedMarketData?: FixedMarketData[];
  showModal?: (marketData: Market, type: 'borrow' | 'deposit') => void;
  type?: 'borrow' | 'deposit';
};

function Item({ market, showModal, type, fixedMarketData }: Props) {
  const { date } = useContext(AddressContext);
  const { web3Provider, walletAddress, connect, network } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [fixedLender, setFixedLender] = useState<ethers.Contract | undefined>(undefined);
  const [rate, setRate] = useState<string | undefined>(undefined);

  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 600000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData, market]);

  useEffect(() => {
    if (date?.value && fixedLender) {
      getMarketData();
    }
  }, [date, network, market, accountData, time]);

  async function getFixedLenderContract() {
    if (!market) return;
    const filteredFixedLender = fixedLenderData.find((fl) => fl.address == market.market);

    const fixedLender = await getContractData(
      network?.name,
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      web3Provider?.getSigner()
    );

    setFixedLender(fixedLender);
  }

  function handleClick() {
    if (!market || !showModal || !type) return;

    if (!walletAddress && connect) return connect();

    showModal(market, type);
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
        ethers.utils.formatEther(accountData[market?.symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: parseFloat(await ethers.utils.formatUnits(pool.borrowed, decimals)),
        supplied: parseFloat(await ethers.utils.formatUnits(pool.supplied, decimals)),
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
            <img
              src={`/img/assets/${market?.symbol.toLowerCase()}.png`}
              alt={market?.symbol}
              className={style.assetImage}
            />
          )) || <Skeleton circle width={40} height={40} />}
          <span className={style.primary}>
            {(market && parseSymbol(market?.symbol)) || <Skeleton width={30} />}
          </span>
        </div>
      </Link>
      <p className={style.value}>
        {poolData && market ? (
          type == 'borrow' ? (
            `$${formatNumber(poolData?.borrowed! * poolData?.rate!, 'USD')}`
          ) : (
            `$${formatNumber(poolData?.supplied! * poolData?.rate!, 'USD')}`
          )
        ) : (
          <Skeleton />
        )}
      </p>
      <p className={style.value}>{rate || <Skeleton />}</p>
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
