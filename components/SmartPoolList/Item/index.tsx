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

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: String) => void;
  src: string;
};

function Item({ market, showModal, src }: Props) {
  const { date } = useContext(AddressContext);
  const fixedLender = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

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
    const borrowed = await contract?.smartPoolBorrowed();
    const supplied = 0;

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
        <Button text={translations[lang].deposit} className={'tertiary'} />
      </div>
    </div>
  );
}

export default Item;
