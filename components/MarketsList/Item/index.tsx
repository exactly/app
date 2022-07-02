import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { request } from 'graphql-request';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';

import Button from 'components/common/Button';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

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
import getSubgraph from 'utils/getSubgraph';

import { getLastMaturityPoolBorrowRate, getLastMaturityPoolDepositRate } from 'queries';

type Props = {
  market?: Market;
  showModal?: (marketData: Market, type: 'borrow' | 'deposit') => void;
  type?: 'borrow' | 'deposit';
};

function Item({ market, showModal, type }: Props) {
  const { date } = useContext(AddressContext);
  const { web3Provider, walletAddress, connect, network } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [fixedLender, setFixedLender] = useState<ethers.Contract | undefined>(undefined);
  const [rate, setRate] = useState<string | undefined>(undefined);

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData, market]);

  useEffect(() => {
    if (date?.value && fixedLender) {
      setPoolData(undefined);
      setRate(undefined);
      getMarketData();
    }
  }, [date, fixedLender, market, accountData]);

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

    try {
      const { borrowed, supplied } = await fixedLender?.maturityPools(date?.value);

      const decimals = await fixedLender?.decimals();

      const exchangeRate = parseFloat(
        ethers.utils.formatEther(accountData[market?.symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: parseFloat(await ethers.utils.formatUnits(borrowed, decimals)),
        supplied: parseFloat(await ethers.utils.formatUnits(supplied, decimals)),
        rate: exchangeRate
      };

      setPoolData(newPoolData);
    } catch (e) {
      console.log(e);
    }

    try {
      let fee;
      let amount;

      const subgraphUrl = getSubgraph(network?.name);
      const decimals = await fixedLender?.decimals();

      if (type == 'borrow') {
        const getLastBorrowRate = await request(
          subgraphUrl,
          getLastMaturityPoolBorrowRate(market.market, date?.value!)
        );

        fee = getLastBorrowRate?.borrowAtMaturities[0]?.fee;
        amount = getLastBorrowRate?.borrowAtMaturities[0]?.assets;
      } else if (type == 'deposit') {
        const getLastDepositRate = await request(
          subgraphUrl,
          getLastMaturityPoolDepositRate(market.market, date?.value!)
        );

        fee = getLastDepositRate?.depositAtMaturities[0]?.fee;
        amount = getLastDepositRate?.depositAtMaturities[0]?.assets;
      }

      if (!fee || !amount) return setRate('N/A');

      const currentTimestamp = new Date().getTime() / 1000;

      const time = 31536000 / (parseInt(date?.value!) - currentTimestamp);

      const rate =
        parseFloat(ethers.utils.formatUnits(fee, decimals)) /
        parseFloat(ethers.utils.formatUnits(amount, decimals));

      const fixedAPY = (Math.pow(1 + rate, time) - 1) * 100;

      if (fixedAPY <= 0.01) {
        return setRate('N/A');
      }

      setRate(`${fixedAPY.toFixed(2)}%`);
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
