import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import Button from 'components/common/Button';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import LangContext from 'contexts/LangContext';

import useContract from 'hooks/useContract';

import style from './style.module.scss';

import keys from './translations.json';
import PoolAccountingContext from 'contexts/PoolAccountingContext';

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  type: 'borrow' | 'deposit';
  src: string;
};

function Item({ market, showModal, type, src }: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);
  const poolAccountingData = useContext(PoolAccountingContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const poolAccounting = useContract(
    poolAccountingData?.address!,
    poolAccountingData.abi!
  );
  const { contract } = useContract(market?.address, fixedLender?.abi!);

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);

  useEffect(() => {
    if (date?.value && contract) {
      getMarketData();
    }
  }, [date, contract]);

  function handleClick() {
    showModal(market?.address, type);
  }

  async function getMarketData() {
    const { borrowed, supplied } = await poolAccounting.contract?.maturityPools(
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
