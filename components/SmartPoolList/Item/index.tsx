import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('components/common/Button'));

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import style from './style.module.scss';

import keys from './translations.json';

import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';
import getFloatingAPY from 'utils/getFloatingAPY';
import getSubgraph from 'utils/getSubgraph';
import getFloatingBorrowAPY from 'utils/getFloatingBorrowAPY';

type Props = {
  market: Market | undefined;
  type: 'borrow' | 'deposit';
};

function Item({ market, type }: Props) {
  const { walletAddress, connect, network } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);
  const { setOpen, setModalContent } = useContext(ModalStatusContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [rate, setRate] = useState<string | undefined>(undefined);

  const [fixedLenderAddress, setFixedLenderAddress] = useState<string | undefined>(undefined);

  async function getFixedLenderContract() {
    if (!market) return;

    const filteredFixedLender = fixedLenderData.find((fl) => fl.address == market.market);

    setFixedLenderAddress(filteredFixedLender?.address);
  }

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData, market]);

  useEffect(() => {
    getMarketData();
    getRates();
  }, [accountData, market, network, fixedLenderAddress]);

  function handleClick(modal: string) {
    if (!market) return;

    if (!walletAddress && connect) return connect();

    setOpen(true);
    setModalContent({ ...market, type: modal });
  }

  async function getRates() {
    if (!market || !accountData) return;
    try {
      const subgraphUrl = getSubgraph(network?.name!);

      let interestRate;

      if (!fixedLenderAddress) return;

      if (type == 'deposit') {
        interestRate = await getFloatingAPY(
          fixedLenderAddress,
          subgraphUrl,
          accountData[market?.symbol.toUpperCase()].maxFuturePools
        );
      } else if (type == 'borrow') {
        interestRate = await getFloatingBorrowAPY(fixedLenderAddress, subgraphUrl);
      }

      if (interestRate && rate && `${interestRate}%` == rate) {
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
            (type == 'borrow' ? poolData?.borrowed! : poolData?.supplied!) * poolData?.rate!,
            'USD'
          )}`) || <Skeleton />}
      </p>
      <p className={style.value}>{(rate && rate) || <Skeleton />}</p>
      <div className={style.buttonContainer}>
        {(market && (
          <Button
            text={type == 'borrow' ? translations[lang].borrow : translations[lang].deposit}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(type == 'borrow' ? 'floatingBorrow' : 'smartDeposit');
            }}
            className={type == 'borrow' ? 'secondary' : 'primary'}
          />
        )) || <Skeleton height={40} />}
      </div>
    </div>
  );
}

export default Item;
