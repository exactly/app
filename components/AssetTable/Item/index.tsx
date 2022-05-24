import { useContext, useEffect, useState } from 'react';
import request from 'graphql-request';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';
import { Dictionary } from 'types/Dictionary';

import styles from './style.module.scss';

import keys from './translations.json';

import getSubgraph from 'utils/getSubgraph';

import { getLastMaturityPoolBorrowRate, getLastMaturityPoolDepositRate } from 'queries';

type Props = {
  maturity: Maturity;
  market: string;
  showModal: (type: string, maturity: string | undefined) => void;
};

function Item({ maturity, market, showModal }: Props) {
  const { walletAddress, connect, network } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [lastFixedRate, setLastFixedRate] = useState<Dictionary<string> | undefined>(undefined);

  useEffect(() => {
    getLastFixedRate();
  }, [maturity.value, market]);

  async function getLastFixedRate() {
    try {
      const subgraphUrl = getSubgraph(network?.name);

      const getLastBorrowRate = await request(
        subgraphUrl,
        getLastMaturityPoolBorrowRate(market, maturity.value)
      );

      const borrowFee = getLastBorrowRate?.borrowAtMaturities[0]?.fee;
      const borrowAmount = getLastBorrowRate?.borrowAtMaturities[0]?.assets;

      const getLastDepositRate = await request(
        subgraphUrl,
        getLastMaturityPoolDepositRate(market, maturity.value)
      );

      const depositFee = getLastDepositRate?.depositAtMaturities[0]?.fee;
      const depositAmount = getLastDepositRate?.depositAtMaturities[0]?.assets;

      const borrowFixedRate = (parseFloat(borrowFee) * 100) / parseFloat(borrowAmount);
      const depositFixedRate = (parseFloat(depositFee) * 100) / parseFloat(depositAmount);

      setLastFixedRate({
        deposit: isNaN(depositFixedRate) ? '0.00' : depositFixedRate.toFixed(2),
        borrow: isNaN(borrowFixedRate) ? '0.00' : borrowFixedRate.toFixed(2)
      });
    } catch (e) {
      console.log(e);
    }
  }

  function handleClick(type: string, maturity: string) {
    if (!walletAddress && connect) return connect();
    showModal(type, maturity);
  }

  return (
    <div className={styles.row}>
      <div className={styles.maturity}>
        <span>{maturity.label}</span>
        <span className={styles.liquidity}>{translations[lang].liquidity}: $1.3B</span>
      </div>
      <div className={styles.lastFixedRate}>
        <div className={styles.deposit}>{lastFixedRate?.deposit}%</div>
        <div className={styles.borrow}>{lastFixedRate?.borrow}%</div>
      </div>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          <Button
            text={translations[lang].deposit}
            className="primary"
            onClick={() => handleClick('deposit', maturity.value)}
          />
        </div>
        <div className={styles.buttonContainer}>
          <Button
            text={translations[lang].borrow}
            className="secondary"
            onClick={() => handleClick('borrow', maturity.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default Item;
