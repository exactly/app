import { useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
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
import getVariableAPY from 'utils/getFloatingAPY';
import getSubgraph from 'utils/getSubgraph';

type Props = {
  market: Market | undefined;
  showModal?: (marketData: Market, type: String) => void;
  type: 'borrow' | 'deposit';
};

function Item({ market, showModal, type }: Props) {
  const { date } = useContext(AddressContext);
  const { web3Provider, walletAddress, connect, network } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [rate, setRate] = useState<string | undefined>(undefined);

  const [fixedLender, setFixedLender] = useState<Contract | undefined>(undefined);

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

  useEffect(() => {
    getFixedLenderContract();
  }, [fixedLenderData]);

  useEffect(() => {
    if (date?.value && fixedLender) {
      getMarketData();
    }
  }, [date, accountData, market]);

  function handleClick(modal: string) {
    if (!market || !showModal) return;

    if (!walletAddress && connect) return connect();

    showModal(market, modal);
  }

  async function getMarketData() {
    if (!market || !accountData) return;

    setPoolData(undefined);
    setRate(undefined);
    try {
      const borrowed = accountData[market?.symbol.toUpperCase()].totalFloatingBorrowAssets;
      const supplied = accountData[market?.symbol.toUpperCase()].totalFloatingDepositAssets;
      const decimals = accountData[market?.symbol.toUpperCase()].decimals;

      const exchangeRate = parseFloat(
        ethers.utils.formatEther(accountData[market?.symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: Math.round(parseInt(ethers.utils.formatUnits(borrowed, decimals))),
        supplied: Math.round(parseInt(ethers.utils.formatUnits(supplied, decimals))),
        rate: exchangeRate
      };

      const subgraphUrl = getSubgraph(network?.name!);

      const interestRate = await getVariableAPY(
        fixedLender?.address!,
        subgraphUrl,
        accountData[market?.symbol.toUpperCase()].maxFuturePools
      );

      interestRate && setRate(interestRate);

      setPoolData(newPoolData);
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
              className={style.assetImage}
              alt={market?.symbol}
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
      <p className={style.value}>{(rate && `${rate}%`) || <Skeleton />}</p>
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
