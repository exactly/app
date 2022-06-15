import { useContext, useMemo, useState } from 'react';
import { Contract, ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import Button from 'components/common/Button';
import Tooltip from 'components/Tooltip';

import parseSymbol from 'utils/parseSymbol';

interface Props {
  showModal: (type: string, maturity: string | undefined) => void;
  symbol: string;
  fixedLender: Contract | undefined;
}

function SmartPoolInfo({ showModal, symbol, fixedLender }: Props) {
  const { walletAddress, connect } = useWeb3Context();

  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [supply, setSupply] = useState<number | undefined>(undefined);
  const [demand, setDemand] = useState<number | undefined>(undefined);

  useMemo(() => {
    if (fixedLender) {
      getSmartPoolData();
    }
  }, [fixedLender, accountData]);

  async function getSmartPoolData() {
    if (!accountData || !symbol) return;

    try {
      const borrowed = await fixedLender?.smartPoolBorrowed();
      const supplied = await fixedLender?.smartPoolAssets();
      const decimals = await fixedLender?.decimals();
      const exchangeRate = parseFloat(ethers.utils.formatEther(accountData[symbol].oraclePrice));

      const newPoolData = {
        borrowed: parseFloat(await ethers.utils.formatUnits(borrowed, decimals)),
        supplied: parseFloat(await ethers.utils.formatUnits(supplied, decimals))
      };

      setSupply(newPoolData.supplied * exchangeRate);
      setDemand(newPoolData.borrowed * exchangeRate);
    } catch (e) {
      console.log(e);
    }
  }

  function handleClick() {
    if (!walletAddress && connect) return connect();

    showModal('smartDeposit', undefined);
  }

  return (
    <div className={styles.maturityContainer}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].smartPool}</p>
        <Tooltip value={translations[lang].smartPool} />
      </div>
      <ul className={styles.table}>
        <li className={styles.header}>
          <div className={styles.assetInfo}>
            <img
              className={styles.assetImage}
              src={`/img/assets/${symbol.toLowerCase()}.png`}
              alt={symbol}
            />
            <p className={styles.asset}>{parseSymbol(symbol)}</p>
          </div>
          <div className={styles.buttonContainer}>
            <Button
              text={translations[lang].deposit}
              className="tertiary"
              onClick={() => handleClick()}
            />
          </div>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].totalDeposited}</span>{' '}
          <p className={styles.value}>
            {(supply != undefined && `$${supply.toFixed(2)}`) || <Skeleton />}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}> {translations[lang].liquidity}</span>{' '}
          <p className={styles.value}>
            {supply != undefined && demand != undefined ? (
              `$${(supply - demand).toFixed(2)}`
            ) : (
              <Skeleton />
            )}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].utilizationRate}</span>{' '}
          <p className={styles.value}>
            {supply != undefined && demand != undefined ? (
              `${((demand / supply) * 100 || 0).toFixed(2)}%`
            ) : (
              <Skeleton />
            )}{' '}
          </p>
        </li>
      </ul>
    </div>
  );
}

export default SmartPoolInfo;
