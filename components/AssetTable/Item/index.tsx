import { useContext, useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  maturity: Maturity | undefined;
  market: string | undefined;
  showModal: (maturity: string | undefined, type: string) => void | undefined;
  deposits: Array<Maturity> | undefined;
  borrows: Array<Maturity> | undefined;
};

function Item({ maturity, showModal, deposits, borrows }: Props) {
  const { walletAddress, connect } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [currentMaturity, setCurrentMaturity] = useState<Maturity | undefined>(undefined);
  const [currentDeposit, setCurrentDeposit] = useState<Maturity | undefined>(undefined);
  const [currentBorrow, setCurrentBorrow] = useState<Maturity | undefined>(undefined);

  useEffect(() => {
    setCurrentMaturity(undefined);
    setCurrentDeposit(undefined);
    setCurrentBorrow(undefined);
    if (!deposits && !borrows && !maturity) return;
    const deposit = deposits?.find((deposit: Maturity) => deposit.value === maturity?.value);
    const borrow = borrows?.find((borrow: Maturity) => borrow.value === maturity?.value);

    setCurrentMaturity(maturity);
    setCurrentDeposit(deposit);
    setCurrentBorrow(borrow);
  }, [deposits, borrows, maturity]);

  function handleClick(type: string, maturity: string) {
    if (!walletAddress && connect) return connect();
    showModal(maturity, type);
  }

  return (
    <div className={styles.row}>
      <div className={styles.maturity}>
        <span className={styles.value}>{currentMaturity?.label || <Skeleton />}</span>
        {/* <span className={styles.liquidity}>{translations[lang].liquidity}: $1.3B</span> */}
      </div>
      <div className={styles.lastFixedRate}>
        <div className={styles.deposit}>
          {currentDeposit && currentDeposit.apy != 0 ? (
            `${currentDeposit.apy}%`
          ) : currentDeposit ? (
            `N/A`
          ) : (
            <Skeleton />
          )}
        </div>
        <div className={styles.borrow}>
          {currentBorrow && currentBorrow.apy != 0 ? (
            `${currentBorrow?.apy}%`
          ) : currentBorrow ? (
            'N/A'
          ) : (
            <Skeleton />
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          {currentMaturity && maturity ? (
            <Button
              text={translations[lang].deposit}
              className="primary"
              onClick={() => handleClick('deposit', maturity.value)}
            />
          ) : (
            <Skeleton className={styles.buttonContainer} />
          )}
        </div>
        <div className={styles.buttonContainer}>
          {currentMaturity && maturity ? (
            <Button
              text={translations[lang].borrow}
              className="secondary"
              onClick={() => handleClick('borrow', maturity.value)}
            />
          ) : (
            <Skeleton className={styles.buttonContainer} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Item;
