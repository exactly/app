import { useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';

import Button from 'components/common/Button';

import { Market } from 'types/Market';
import { Pool } from 'types/Pool';
import { LangKeys } from 'types/Lang';

import FixedLenderContext from 'contexts/FixedLenderContext';
import { AddressContext } from 'contexts/AddressContext';
import LangContext from 'contexts/LangContext';

import style from './style.module.scss';

import keys from './translations.json';
import PoolAccountingContext from 'contexts/PoolAccountingContext';
import { getContractData } from 'utils/contracts';

type Props = {
  market: Market;
  showModal: (address: Market['address'], type: String) => void;
  src: string;
};

function Item({ market, showModal, src }: Props) {
  const { date } = useContext(AddressContext);
  const lang: string = useContext(LangContext);

  const fixedLenderData = useContext(FixedLenderContext);
  const poolAccountingData = useContext(PoolAccountingContext);

  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);

  const [fixedLender, setFixedLender] = useState<Contract | undefined>(undefined);
  const [poolAccounting, setPoolAccounting] = useState<Contract | undefined>(undefined);

  async function getFixedLenderContract() {
    const filteredFixedLender = fixedLenderData.find(fl => fl.address == market.address)
    const fixedLender = await getContractData(market.address, filteredFixedLender?.abi!, false)
    setFixedLender(fixedLender)
    getPoolAccountingContract(fixedLender)
  }

  async function getPoolAccountingContract(fixedLender: Contract | undefined) {
    const poolAccounting = await getContractData(fixedLender?.poolAccounting(), poolAccountingData.abi!, false);
    setPoolAccounting(poolAccounting);
  }

  useEffect(() => {
    getFixedLenderContract();
  }, [])

  useEffect(() => {
    if (date?.value && fixedLender && poolAccounting) {
      getMarketData();
    }
  }, [date, fixedLender, poolAccounting]);

  function handleClick() {
    showModal(market?.address, 'smartDeposit');
  }

  async function getMarketData() {
    const borrowed = await poolAccounting?.smartPoolBorrowed();
    const supplied = await fixedLender?.getSmartPoolDeposits();

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
