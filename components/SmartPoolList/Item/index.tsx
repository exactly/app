import { useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';

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

type Props = {
  market?: Market;
  showModal?: (marketData: Market, type: String) => void;
};

function Item({ market, showModal }: Props) {
  const { date } = useContext(AddressContext);
  const { web3Provider, walletAddress, connect, network } = useWeb3Context();

  const fixedLenderData = useContext(FixedLenderContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [poolData, setPoolData] = useState<Pool | undefined>(undefined);

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
  }, [date, fixedLender]);

  function handleClick() {
    if (!market || !showModal) return;
    if (!walletAddress && connect) return connect();

    showModal(market, 'smartDeposit');
  }

  async function getMarketData() {
    const borrowed = await fixedLender?.smartPoolBorrowed();
    const supplied = await fixedLender?.smartPoolAssets();

    const newPoolData = {
      borrowed: Math.round(parseInt(await ethers.utils.formatEther(borrowed))),
      supplied: Math.round(parseInt(await ethers.utils.formatEther(supplied)))
    };

    setPoolData(newPoolData);
  }

  return (
    <div className={`${style.container} ${style.primaryContainer}`} onClick={handleClick}>
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
      <span className={style.value}>
        {(market && poolData && formatNumber(poolData?.supplied!, market?.symbol)) || <Skeleton />}
      </span>
      <div className={style.buttonContainer}>
        {(market && <Button text={translations[lang].deposit} className={'tertiary'} />) || (
          <Skeleton height={40} />
        )}
      </div>
    </div>
  );
}

export default Item;
