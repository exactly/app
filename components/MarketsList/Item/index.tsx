import { useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';

import Button from 'components/common/Button';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import LangContext from 'contexts/LangContext';
import PoolAccountingContext from 'contexts/PoolAccountingContext';

import style from './style.module.scss';

import keys from './translations.json';
import { getContractData } from 'utils/contracts';

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  type: 'borrow' | 'deposit';
  src: string;
};

function Item({ market, showModal, type, src }: Props) {
  const { date } = useContext(AddressContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const poolAccountingData = useContext(PoolAccountingContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);
  const [fixedLender, setFixedLender] = useState<ethers.Contract | undefined>(undefined);
  const [poolAccounting, setPoolAccounting] = useState<ethers.Contract | undefined>(undefined);

  useEffect(() => {
    getFixedLenderContract();
  }, []);

  useEffect(() => {
    if (date?.value && fixedLender && poolAccounting) {
      getMarketData();
    }
  }, [date, fixedLender, poolAccounting]);

  async function getFixedLenderContract() {
    const fixedLender = await getContractData(market?.address, fixedLenderData?.abi!, false)
    setFixedLender(fixedLender)
    getPoolAccountingContract(fixedLender)
  }

  async function getPoolAccountingContract(fixedLender: Contract | undefined) {
    const poolAccounting = await getContractData(fixedLender?.poolAccounting(), poolAccountingData.abi!, false);
    setPoolAccounting(poolAccounting);
  }

  function handleClick() {
    showModal(market?.address, type);
  }

  async function getMarketData() {
    const { borrowed, supplied } = await poolAccounting?.maturityPools(
      date?.value
    );

    const newPoolData = {
      borrowed: Math.round(parseInt(await ethers.utils.formatEther(borrowed))),
      supplied: Math.round(parseInt(await ethers.utils.formatEther(supplied)))
    };

    setPoolData(newPoolData);
  }

  return (
    <div
      className={`${style.container} ${type == 'borrow' ? style.secondaryContainer : style.primaryContainer
        }`}
      onClick={handleClick}
    >
      <div className={style.symbol}>
        <img src={src} className={style.assetImage} />
        <span className={style.primary}>{market?.symbol}</span>
      </div>
      <span className={style.value}>
        {type == 'borrow' ? poolData?.borrowed : poolData?.supplied}
      </span>
      <div className={style.buttonContainer}>
        <Button
          text={
            type == 'borrow'
              ? translations[lang].borrow
              : translations[lang].deposit
          }
          className={type == 'borrow' ? 'secondary' : 'primary'}
        />
      </div>
    </div>
  );
}

export default Item;
