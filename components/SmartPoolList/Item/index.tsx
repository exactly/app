import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import Button from 'components/common/Button';

import style from './style.module.scss';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';

import useContract from 'hooks/useContract';

import dictionary from 'dictionary/en.json';

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: String) => void;
  src: string;
};

function Item({ market, showModal, src }: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);

  const { contract } = useContract(market?.address, fixedLender?.abi!);

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);

  useEffect(() => {
    if (date?.value && contract) {
      getMarketData();
    }
  }, [date, contract]);

  function handleClick() {
    showModal(market?.address, 'smartDeposit');
  }

  async function getMarketData() {
    const { borrowed, supplied } = await contract?.smartPool();

    const newPoolData = {
      borrowed: Math.round(parseInt(await ethers.utils.formatEther(borrowed))),
      supplied: Math.round(parseInt(await ethers.utils.formatEther(supplied)))
    };

    setPoolData(newPoolData);
  }

  return (
    <div
      className={`${style.container} ${style.primaryContainer}`}
      onClick={handleClick}
    >
      <div className={style.symbol}>
        <img src={src} className={style.assetImage} />
        <span className={style.primary}>{market?.symbol}</span>
      </div>
      <span className={style.value}>{poolData?.supplied}</span>
      <div className={style.buttonContainer}>
        <Button text={dictionary.deposit} className={'tertiary'} />
      </div>
    </div>
  );
}

export default Item;
