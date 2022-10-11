import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { captureException } from '@sentry/browser';

const Button = dynamic(() => import('components/common/Button'));

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/AddressContext';

import style from './style.module.scss';

import keys from './translations.json';

import numbers from 'config/numbers.json';

import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';
import getSubgraph from 'utils/getSubgraph';
import queryRate from 'utils/queryRates';

type Props = {
  market: Market | undefined;
  type: 'borrow' | 'deposit';
};

function Item({ market, type }: Props) {
  const { walletAddress, connect, network } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [rate, setRate] = useState<string | undefined>(undefined);
  const [eMarketAddress, setEMarketAddress] = useState<string | undefined>(undefined);

  async function getFixedLenderContract() {
    if (!market) return;

    const filteredFixedLender = fixedLenderData.find((fl) => fl.address === market.market);

    setEMarketAddress(filteredFixedLender?.address);
  }

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData, market]);

  useEffect(() => {
    getMarketData();
    getRates();
  }, [accountData, market, network, eMarketAddress]);

  useEffect(() => {
    checkWeirdAPY();
  }, [rate]);

  function handleClick(type: Operation) {
    if (!market) return;

    if (!walletAddress && connect) return connect();

    setMarket({ value: market.market });
    setOperation(type);
    setOpen(true);
  }

  async function getRates() {
    if (!market || !accountData) return;
    try {
      const subgraphUrl = getSubgraph(network?.name!);

      let interestRate;

      if (!eMarketAddress) return;

      if (type === 'deposit') {
        const maxFuturePools = accountData[market?.symbol.toUpperCase()].maxFuturePools;
        const data = await queryRate(subgraphUrl, eMarketAddress, 'deposit', { maxFuturePools });

        interestRate = data[0].rate.toFixed(2);
      }

      if (type === 'borrow') {
        const data = await queryRate(subgraphUrl, eMarketAddress, 'borrow');

        interestRate = data[0].rate.toFixed(2);
      }

      if (interestRate && rate && `${interestRate}%` === rate) {
        return;
      }

      if (interestRate != 'N/A') {
        return interestRate && setRate(`${interestRate}%`);
      } else {
        return setRate('N/A');
      }
    } catch (e) {
      console.log(e);
    }
  }

  function checkWeirdAPY() {
    if (!market || !rate) return;
    const apy = Number(rate.substring(0, rate.length - 1)); // remove % symbol from rate

    try {
      if (apy < numbers.minAPYValue || apy > numbers.maxAPYValue) {
        throw new Error(`weirdAPYs | ${rate} in ${type} ${market.symbol}`);
      }
    } catch (e) {
      captureException(e);
    }
  }

  async function getMarketData() {
    if (!market || !accountData) return;

    try {
      const borrowed = accountData[market?.symbol.toUpperCase()].totalFloatingBorrowAssets;
      const supplied = accountData[market?.symbol.toUpperCase()].totalFloatingDepositAssets;
      const decimals = accountData[market?.symbol.toUpperCase()].decimals;

      const exchangeRate = parseFloat(
        ethers.utils.formatEther(accountData[market?.symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: parseFloat(ethers.utils.formatUnits(borrowed, decimals)),
        supplied: parseFloat(ethers.utils.formatUnits(supplied, decimals)),
        rate: exchangeRate
      };

      if (
        newPoolData.borrowed !== poolData?.borrowed ||
        newPoolData.supplied !== poolData?.supplied ||
        newPoolData.rate !== poolData.rate
      ) {
        setPoolData(newPoolData);
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div
      className={`${style.container} ${
        type === 'borrow' ? style.secondaryContainer : style.primaryContainer
      }`}
    >
      <Link href={`/assets/${market?.symbol === 'WETH' ? 'eth' : market?.symbol.toLowerCase()}`}>
        <div className={style.symbol}>
          {(market && (
            <Image
              src={`/img/assets/${market?.symbol.toLowerCase()}.svg`}
              alt={market?.symbol}
              width={40}
              height={40}
            />
          )) || <Skeleton circle height={40} width={40} />}
          <span className={style.primary}>
            {(market && parseSymbol(market?.symbol)) || <Skeleton />}
          </span>
        </div>
      </Link>
      <p className={style.value}>
        {(market &&
          poolData &&
          `$${formatNumber(
            (type === 'borrow' ? poolData?.borrowed! : poolData?.supplied!) * poolData?.rate!,
            'USD'
          )}`) || <Skeleton />}
      </p>
      <p className={style.value}>{(rate && rate) || <Skeleton />}</p>
      <div className={style.buttonContainer}>
        {(market && (
          <Button
            text={type === 'borrow' ? translations[lang].borrow : translations[lang].deposit}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(type === 'borrow' ? 'borrow' : 'deposit');
            }}
            className={type === 'borrow' ? 'secondary' : 'primary'}
          />
        )) || <Skeleton height={40} />}
      </div>
    </div>
  );
}

export default Item;
