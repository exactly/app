import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import Button from 'components/common/Button';

import style from './style.module.scss';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';

import useContract from 'hooks/useContract';

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  type: 'borrow' | 'deposit';
  src: string;
};

function Item({ market, showModal, type, src }: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);

  const { contract } = useContract(market?.address, fixedLender?.abi!);

  const [poolData, setPoolData] = useState<Pool>({
    available: 0,
    borrowed: 0,
    debt: 0,
    supplied: 0
  });

  useEffect(() => {
    if (date?.value && contract) {
      getMarketData();
    }
  }, [date, contract]);

  function handleClick() {
    showModal(market?.address, type);
  }

  async function getMarketData() {
    const poolFields = await contract?.maturityPools(date?.value);

    //we have to see wich ones we want to show, meanwhile I leave everything here

    const available = Math.round(
      parseInt(await ethers.utils.formatEther(poolFields?.available))
    );
    const borrowed = Math.round(
      parseInt(await ethers.utils.formatEther(poolFields?.borrowed))
    );
    const debt = Math.round(
      parseInt(await ethers.utils.formatEther(poolFields?.debt))
    );
    const supplied = Math.round(
      parseInt(await ethers.utils.formatEther(poolFields?.supplied))
    );

    setPoolData({ available, borrowed, debt, supplied });
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
          text={type == 'borrow' ? 'Borrow' : 'Deposit'}
          className={type == 'borrow' ? 'secondary' : 'primary'}
        />
      </div>
    </div>
  );
}

export default Item;
