import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { request } from 'graphql-request';

import Button from 'components/common/Button';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import style from './style.module.scss';

import keys from './translations.json';
import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';
import getSubgraph from 'utils/getSubgraph';

import { getLastMaturityPoolBorrowRate, getLastMaturityPoolDepositRate } from 'queries';

type Props = {
  market: Market;
  showModal: (marketData: Market, type: 'borrow' | 'deposit') => void;
  type: 'borrow' | 'deposit';
  src: string;
};

function Item({ market, showModal, type, src }: Props) {
  const { date } = useContext(AddressContext);
  const { walletAddress, connect } = useWeb3Context();
  const fixedLenderData = useContext(FixedLenderContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { web3Provider } = useWeb3Context();

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [fixedLender, setFixedLender] = useState<ethers.Contract | undefined>(undefined);
  const [rate, setRate] = useState<string>('0');

  useEffect(() => {
    getFixedLenderContract();
  }, []);

  useEffect(() => {
    if (date?.value && fixedLender) {
      getMarketData();
    }
  }, [date, fixedLender]);

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find((fl) => fl.address == market.market);

    const fixedLender = await getContractData(
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!,
      web3Provider?.getSigner()
    );

    setFixedLender(fixedLender);
  }

  function handleClick() {
    if (!walletAddress && connect) return connect();

    showModal(market, type);
  }

  async function getMarketData() {
    const { borrowed, supplied } = await fixedLender?.maturityPools(date?.value);

    const newPoolData = {
      borrowed: parseFloat(await ethers.utils.formatEther(borrowed)),
      supplied: parseFloat(await ethers.utils.formatEther(supplied))
    };

    try {
      let fee;
      let amount;

      const subgraphUrl = getSubgraph();

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

      const fixedRate = (parseFloat(fee) * 100) / parseFloat(amount);

      setRate(isNaN(fixedRate) ? '0.00' : fixedRate.toFixed(2));
    } catch (e) {
      console.log(e);
    }

    setPoolData(newPoolData);
  }

  return (
    <div
      className={`${style.container} ${
        type == 'borrow' ? style.secondaryContainer : style.primaryContainer
      }`}
      onClick={handleClick}
    >
      <div className={style.symbol}>
        <img src={src} alt={market?.symbol} className={style.assetImage} />
        <span className={style.primary}>{parseSymbol(market?.symbol)}</span>
      </div>
      <span className={style.value}>
        {type == 'borrow'
          ? formatNumber(poolData?.borrowed!, market?.symbol)
          : formatNumber(poolData?.supplied!, market?.symbol)}
      </span>
      <span className={style.value}>{rate}%</span>
      <div className={style.buttonContainer}>
        <Button
          text={type == 'borrow' ? translations[lang].borrow : translations[lang].deposit}
          className={type == 'borrow' ? 'secondary' : 'primary'}
        />
      </div>
    </div>
  );
}

export default Item;
