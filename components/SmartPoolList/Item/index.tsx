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
import getSmartPoolInterestRate from 'utils/getSmartPoolInterestRate';

type Props = {
  market: Market | undefined;
  showModal?: (marketData: Market, type: String) => void;
};

function Item({ market, showModal }: Props) {
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
  }, [date, fixedLender, accountData]);

  function handleClick() {
    if (!market || !showModal) return;

    if (!walletAddress && connect) return connect();

    showModal(market, 'smartDeposit');
  }

  async function getMarketData() {
    if (!market || !accountData) return;
    try {
      const borrowed = await fixedLender?.smartPoolBorrowed();
      const supplied = await fixedLender?.smartPoolAssets();
      const decimals = await fixedLender?.decimals();

      const exchangeRate = parseFloat(
        ethers.utils.formatEther(accountData[market?.symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: Math.round(parseInt(await ethers.utils.formatUnits(borrowed, decimals))),
        supplied: Math.round(parseInt(await ethers.utils.formatUnits(supplied, decimals))),
        rate: exchangeRate
      };

      const interestRate = await getSmartPoolInterestRate(network?.name!, fixedLender?.address!);

      setRate(interestRate);
      setPoolData(newPoolData);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={`${style.container} ${style.primaryContainer}`}>
      <Link href={`/assets/${market?.symbol.toLowerCase()}`}>
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
          `$${formatNumber(poolData?.supplied! * poolData?.rate!, 'USD')}`) || <Skeleton />}
      </p>
      <p className={style.value}>{(rate && `${rate}%`) || <Skeleton />}</p>
      <div className={style.buttonContainer}>
        {(market && (
          <Button
            text={translations[lang].deposit}
            className={'tertiary'}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          />
        )) || <Skeleton height={40} />}
      </div>
    </div>
  );
}

export default Item;
