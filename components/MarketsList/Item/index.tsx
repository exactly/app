import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

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

type Props = {
  market: Market;
  showModal: (marketData: Market, type: 'borrow' | 'deposit') => void;
  type: 'borrow' | 'deposit';
  src: string;
};

function Item({ market, showModal, type, src }: Props) {
  const { date } = useContext(AddressContext);

  const fixedLenderData = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { web3Provider } = useWeb3Context();

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [fixedLender, setFixedLender] = useState<ethers.Contract | undefined>(undefined);

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
    showModal(market, type);
  }

  async function getMarketData() {
    const { borrowed, supplied } = await fixedLender?.maturityPools(date?.value);

    const newPoolData = {
      borrowed: parseFloat(await ethers.utils.formatEther(borrowed)),
      supplied: parseFloat(await ethers.utils.formatEther(supplied))
    };

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
        <img src={src} className={style.assetImage} />
        <span className={style.primary}>{market?.symbol}</span>
      </div>
      <span className={style.value}>
        {type == 'borrow'
          ? formatNumber(poolData?.borrowed!, market?.symbol)
          : formatNumber(poolData?.supplied!, market?.symbol)}
      </span>
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
