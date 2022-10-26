import { useContext, useEffect, useState } from 'react';
import { utils } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import CircleIcon from '@mui/icons-material/Circle';

import Tooltip from 'components/Tooltip';
import OrderAction from 'components/OrderAction';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { HealthFactor } from 'types/HealthFactor';

import styles from './style.module.scss';

import keys from './translations.json';

import parseHealthFactor from 'utils/parseHealthFactor';
import formatNumber from 'utils/formatNumber';
import getHealthFactorData from 'utils/getHealthFactorData';

function DashboardHeader() {
  const { walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [totalDeposit, setTotalDeposit] = useState<string | undefined>(undefined);
  const [totalBorrow, setTotalBorrow] = useState<string | undefined>(undefined);

  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);

  useEffect(() => {
    if (!walletAddress) return;
    getDeposits();
    getHealthFactor();
    getBorrows();
  }, [walletAddress, accountData]);

  function getDeposits() {
    if (!accountData) return;

    const data = Object.values(accountData);
    let allDepositsUSD = 0;

    data.forEach((fixedLender) => {
      const decimals = fixedLender.decimals;
      const oracle = parseFloat(utils.formatUnits(fixedLender.usdPrice, 18));

      const smartPoolDepositValue = parseFloat(
        utils.formatUnits(fixedLender.floatingDepositAssets, decimals),
      );
      const smartPoolDepositValueUSD = smartPoolDepositValue * oracle;

      allDepositsUSD += smartPoolDepositValueUSD; //add the value in USD to the total deposit

      fixedLender.fixedDepositPositions.forEach((supplyPosition) => {
        const maturityDepositValue = parseFloat(
          utils.formatUnits(supplyPosition.position.principal, decimals),
        );
        const maturityDepositValueUSD = maturityDepositValue * oracle;
        allDepositsUSD += maturityDepositValueUSD; //add the value in USD to the total deposit
      });
    });

    allDepositsUSD > 0
      ? setTotalDeposit(formatNumber(allDepositsUSD, 'USD'))
      : setTotalDeposit('0.00');
  }

  function getBorrows() {
    if (!accountData) return;

    const data = Object.values(accountData);
    let allBorrowsUSD = 0;

    data.forEach((fixedLender) => {
      const decimals = fixedLender.decimals;
      const oracle = parseFloat(utils.formatUnits(fixedLender.usdPrice, 18));

      //floatinBorrow
      if (fixedLender.floatingBorrowAssets) {
        const borrowAssets = parseFloat(
          utils.formatUnits(fixedLender.floatingBorrowAssets, decimals),
        );

        allBorrowsUSD += borrowAssets * oracle;
      }

      //fixed borrow
      fixedLender.fixedBorrowPositions.forEach((borrowPosition) => {
        const borrowValue = parseFloat(
          utils.formatUnits(borrowPosition.position.principal, decimals),
        );
        const borrowValueUSD = borrowValue * oracle;
        allBorrowsUSD += borrowValueUSD;
      });
    });

    allBorrowsUSD > 0 ? setTotalBorrow(formatNumber(allBorrowsUSD, 'USD')) : setTotalBorrow('0.00');
  }

  function getHealthFactor() {
    if (!accountData) return;

    const { collateral, debt } = getHealthFactorData(accountData);

    if (!collateral.isZero() || !debt.isZero()) {
      setHealthFactor({ collateral, debt });
    } else {
      setHealthFactor(undefined);
    }
  }

  function getHealthFactorColor() {
    if (!healthFactor) return;

    const hf = parseHealthFactor(healthFactor.debt, healthFactor.collateral);
    const value = Number(hf.substring(0, hf.length - 1));

    if (value >= 1.25) {
      return '#63ca10';
    }
    if (value < 1.25 && value >= 1) {
      return '#BCB03A';
    }
    if (value < 1) {
      return '#FF0000';
    }
  }

  return (
    <section className={styles.headerSection}>
      <div className={styles.titleSection}>
        <h1>{translations[lang].title}</h1>
        <OrderAction />
      </div>

      <section className={styles.stats}>
        <section className={styles.stat}>
          <h3 className={styles.statTitle}>{translations[lang]?.deposit?.toUpperCase()}</h3>
          {walletAddress ? (
            <p className={styles.statValue}>{totalDeposit ? `$${totalDeposit}` : <Skeleton />}</p>
          ) : (
            <p className={styles.statValue}>$0.00</p>
          )}
        </section>
        <section className={styles.stat}>
          <h3 className={styles.statTitle}>{translations[lang]?.borrow?.toUpperCase()}</h3>
          {walletAddress ? (
            <p className={styles.statValue}>{totalBorrow ? `$${totalBorrow}` : <Skeleton />}</p>
          ) : (
            <p className={styles.statValue}>$0.00</p>
          )}
        </section>
        {walletAddress && healthFactor && (
          <section className={styles.stat}>
            <h3 className={styles.statTitle}>{translations[lang]?.healthFactor?.toUpperCase()}</h3>
            <p className={styles.statValue}>
              <CircleIcon
                sx={{
                  color: `${getHealthFactorColor()}`,
                  fontSize: '8px',
                }}
              />
              {parseHealthFactor(healthFactor.debt, healthFactor.collateral)}
            </p>
          </section>
        )}
      </section>
    </section>
  );
}

export default DashboardHeader;
