import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import DonutChart from 'components/DonutChart';
import Tooltip from 'components/Tooltip';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { Dictionary } from 'types/Dictionary';
import { DonutData } from 'types/DonutData';

import styles from './style.module.scss';

import keys from './translations.json';

import parseHealthFactor from 'utils/parseHealthFactor';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

function DashboardHeader() {
  const { walletAddress } = useWeb3Context();
  const accountData = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [healthFactor, setHealthFactor] = useState<Dictionary<number> | undefined>(undefined);
  const [healthFactorData, setHealthFactorData] = useState<Array<DonutData> | undefined>(undefined);

  const notConnected = [
    {
      label: '',
      value: 100,
      color: '#E1E1E1',
      image: ''
    }
  ];

  const defaultDepositData = [
    {
      label: 'DAI',
      value: 100,
      color: '#F19D2B',
      image: '/img/assets/dai.png'
    },
    {
      label: 'ETH',
      value: 100,
      color: '#627EEA',
      image: '/img/assets/ether.png'
    },
    {
      label: 'USDC',
      value: 100,
      color: '#2775CA',
      image: '/img/assets/usdc.png'
    },
    {
      label: 'WBTC',
      value: 100,
      color: '#282138',
      image: '/img/assets/wbtc.png'
    }
  ];

  const defaultRateData = [
    {
      label: 'Deposited',
      value: 75,
      color: '#4D4DE8'
    },
    {
      label: 'Borrowed',
      value: 25,
      color: '#7BF5E1'
    }
  ];

  useEffect(() => {
    if (!walletAddress) return;
    getHealthFactor();
  }, [walletAddress, accountData]);

  function getHealthFactor() {
    if (!accountData.accountData) return;

    let collateral = 0;
    let debt = 0;

    const data = Object.values(accountData.accountData);

    data.forEach((fixedLender: FixedLenderAccountData) => {
      const decimals = fixedLender.decimals;

      if (fixedLender.isCollateral) {
        const assets = parseFloat(ethers.utils.formatUnits(fixedLender.smartPoolAssets, decimals));
        const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));
        const collateralFactor = parseFloat(
          ethers.utils.formatUnits(fixedLender.collateralFactor, decimals)
        );

        collateral += assets * oracle * collateralFactor;
      }

      for (let j = 0; j < fixedLender.maturityBorrowPositions.length; j++) {
        parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, decimals));
        const borrow = fixedLender.maturityBorrowPositions[j];
        const penaltyRate = parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, 18));
        const principal = parseFloat(ethers.utils.formatUnits(borrow.position.principal, decimals));
        const fee = parseFloat(ethers.utils.formatUnits(borrow.position.fee, decimals));
        const maturityTimestamp = borrow.maturity.toNumber();
        const currentTimestamp = new Date().getTime() / 1000;

        debt += principal + fee;
        if (maturityTimestamp > currentTimestamp) {
          debt += (currentTimestamp - maturityTimestamp) * penaltyRate;
        }
      }
    });

    if (collateral > 0 || debt > 0) {
      const healthFactorData = [
        {
          label: '',
          value: collateral,
          color: '#63CA10'
        },
        {
          label: '',
          value: debt,
          color: '#AF0606'
        }
      ];
      setHealthFactorData(healthFactorData);

      setHealthFactor({ collateral, debt });
    } else {
      setHealthFactorData(notConnected);
      setHealthFactor(undefined);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.box}>
          <h3 className={styles.title}>
            {translations[lang].deposits} <Tooltip value={translations[lang].deposits} />
          </h3>
          {walletAddress ? (
            <>
              <p className={styles.value}>$6,724</p>
              <p className={styles.subvalue}>2.14% {translations[lang].apr}</p>
            </>
          ) : (
            <p className={styles.disabledValue}>$0</p>
          )}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart data={walletAddress ? defaultDepositData : notConnected} small />
          {walletAddress && (
            <div className={styles.detail}>
              {defaultDepositData.map((asset, key) => {
                return <Tooltip key={key} value={'$1234'} image={asset.image} />;
              })}
            </div>
          )}
        </div>
        <div className={styles.line}></div>
        <div className={styles.box}>
          <h3 className={styles.title}>
            {translations[lang].rateComposition}{' '}
            <Tooltip value={translations[lang].rateComposition} />
          </h3>
          {walletAddress && (
            <div className={styles.informationContainer}>
              <div className={styles.information}>
                <p className={styles.informationTitle}>
                  <span className={styles.variable} />
                  {translations[lang].variable}
                </p>
                <p className={styles.informationValue}>50%</p>
              </div>
              <div className={styles.information}>
                <p className={styles.informationTitle}>
                  <span className={styles.fixed} />
                  {translations[lang].fixed}
                </p>
                <p className={styles.informationValue}>50%</p>
              </div>
            </div>
          )}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart data={walletAddress ? defaultRateData : notConnected} />
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.box}>
          <h3 className={styles.title}>
            {translations[lang].borrows} <Tooltip value={translations[lang].borrows} />
          </h3>
          {walletAddress ? (
            <>
              <p className={styles.value}>$6,724</p>
              <p className={styles.subvalue}>2.14% {translations[lang].apr}</p>
            </>
          ) : (
            <p className={styles.disabledValue}>$0</p>
          )}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart data={walletAddress ? defaultDepositData : notConnected} small />
          {walletAddress && (
            <div className={styles.detail}>
              {defaultDepositData.map((asset, key) => {
                return <Tooltip key={key} value={'$1234'} image={asset.image} />;
              })}
            </div>
          )}
        </div>
        <div className={styles.line}></div>
        <div className={styles.box}>
          <h3 className={styles.title}>
            {translations[lang].healthFactor} <Tooltip value={translations[lang].healthFactor} />
          </h3>
          {walletAddress && (
            <div className={styles.informationContainer}>
              <div className={styles.information}>
                <p className={styles.informationTitle}>
                  <span className={styles.collateral} />
                  {translations[lang].collateral}
                </p>
                {healthFactor && (
                  <p className={styles.informationValue}>
                    {(
                      (healthFactor.collateral / (healthFactor.collateral + healthFactor.debt)) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                )}
              </div>
              <div className={styles.information}>
                <p className={styles.informationTitle}>
                  <span className={styles.debt} />
                  {translations[lang].debt}
                </p>
                {healthFactor && (
                  <p className={styles.informationValue}>
                    {(
                      (healthFactor.debt / (healthFactor.collateral + healthFactor.debt)) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart
            data={walletAddress && healthFactorData ? healthFactorData : notConnected}
            insideValue={
              walletAddress && healthFactor
                ? parseHealthFactor(healthFactor.debt, healthFactor.collateral)
                : ''
            }
          />
        </div>
      </div>
    </section>
  );
}

export default DashboardHeader;
