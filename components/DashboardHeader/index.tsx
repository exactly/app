import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';

import DonutChart from 'components/DonutChart';
import Tooltip from 'components/Tooltip';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { Dictionary } from 'types/Dictionary';
import { DonutData } from 'types/DonutData';

import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import styles from './style.module.scss';

import keys from './translations.json';

import parseHealthFactor from 'utils/parseHealthFactor';
import getAssetColor from 'utils/getAssetColor';

function DashboardHeader() {
  const { walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [healthFactorData, setHealthFactorData] = useState<Array<DonutData> | undefined>(undefined);
  const [depositData, setDepositData] = useState<Array<DonutData> | undefined>(undefined);
  const [rateData, setRateData] = useState<Array<DonutData> | undefined>(undefined);
  const [borrowData, setBorrowData] = useState<Array<DonutData> | undefined>(undefined);

  const [totalDeposit, setTotalDeposit] = useState<number | undefined>(undefined);
  const [totalBorrow, setTotalBorrow] = useState<number | undefined>(undefined);

  const [rateComposition, setRateComposition] = useState<Dictionary<number> | undefined>(undefined);
  const [healthFactor, setHealthFactor] = useState<Dictionary<number> | undefined>(undefined);

  const notConnected = [
    {
      label: '',
      value: 100,
      color: '#E1E1E1',
      image: ''
    }
  ];

  useEffect(() => {
    if (!walletAddress) return;
    getDeposits();
    getHealthFactor();
    getBorrows();
  }, [walletAddress, accountData]);

  function getDeposits() {
    if (!accountData) return;

    const data = Object.values(accountData);
    const depositData: DonutData[] = [];
    let allDepositsUSD = 0;
    let variableComposition = 0;
    let fixedComposition = 0;

    data.forEach((fixedLender) => {
      const symbol = fixedLender.assetSymbol;
      const decimals = fixedLender.decimals;
      const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, decimals));

      const objectDepositData: DonutData = {
        label: symbol.toUpperCase(),
        value: 0,
        color: getAssetColor(symbol),
        image: `/img/assets/${symbol.toLowerCase()}.png`
      };

      const smartPoolDepositValue = parseFloat(
        ethers.utils.formatUnits(fixedLender.smartPoolAssets, decimals)
      );
      const smartPoolDepositValueUSD = smartPoolDepositValue * oracle;

      objectDepositData.value += smartPoolDepositValueUSD; //add the value in USD to the asset deposit data
      allDepositsUSD += smartPoolDepositValueUSD; //add the value in USD to the total deposit
      variableComposition += smartPoolDepositValueUSD; //add the value in USD to the variable composition %

      fixedLender.maturitySupplyPositions.forEach((supplyPosition) => {
        const maturityDepositValue = parseFloat(
          ethers.utils.formatUnits(supplyPosition.position.principal, decimals)
        );
        const maturityDepositValueUSD = maturityDepositValue * oracle;
        objectDepositData.value += maturityDepositValueUSD; //add the value in USD to the asset deposit data
        allDepositsUSD += maturityDepositValueUSD; //add the value in USD to the total deposit
        fixedComposition += maturityDepositValueUSD; //add the value in USD to the fixed composition %
      });

      if (objectDepositData.value !== 0) depositData.push(objectDepositData);
    });

    allDepositsUSD > 0 ? setDepositData(depositData) : setDepositData(notConnected);
    allDepositsUSD > 0 ? setTotalDeposit(allDepositsUSD) : setTotalDeposit(0);

    //RATE DATA
    if (allDepositsUSD !== 0) {
      const variable = (variableComposition * 100) / allDepositsUSD;
      const fixed = (fixedComposition * 100) / allDepositsUSD;

      variableComposition = parseFloat(variable.toFixed(2));
      fixedComposition = parseFloat(fixed.toFixed(2));

      setRateComposition({ variableComposition, fixedComposition });
      setRateData([
        {
          label: 'Variable',
          value: variable,
          color: '#7BF5E1'
        },
        {
          label: 'Fixed',
          value: fixed,
          color: '#4D4DE8'
        }
      ]);
    } else {
      setRateData(notConnected);
      setRateComposition(undefined);
    }
  }

  function getBorrows() {
    if (!accountData) return;

    const data = Object.values(accountData);
    const borrowData: DonutData[] = [];
    let allBorrowsUSD = 0;

    data.forEach((fixedLender) => {
      const symbol = fixedLender.assetSymbol;
      const decimals = fixedLender.decimals;
      const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, decimals));

      const objectBorrowData: DonutData = {
        label: symbol.toUpperCase(),
        value: 0,
        color: getAssetColor(symbol),
        image: `/img/assets/${symbol.toLowerCase()}.png`
      };

      fixedLender.maturityBorrowPositions.forEach((borrowPosition) => {
        const borrowValue = parseFloat(
          ethers.utils.formatUnits(borrowPosition.position.principal, decimals)
        );
        const borrowValueUSD = borrowValue * oracle;
        objectBorrowData.value += borrowValueUSD;
        allBorrowsUSD += borrowValueUSD;
      });

      if (objectBorrowData.value !== 0) borrowData.push(objectBorrowData);
    });

    allBorrowsUSD > 0 ? setBorrowData(borrowData) : setBorrowData(notConnected);
    allBorrowsUSD > 0 ? setTotalBorrow(allBorrowsUSD) : setTotalBorrow(0);
  }

  function getHealthFactor() {
    if (!accountData) return;

    let collateral = 0;
    let debt = 0;

    const data = Object.values(accountData);

    data.forEach((fixedLender: FixedLenderAccountData) => {
      const decimals = fixedLender.decimals;

      if (fixedLender.isCollateral) {
        const assets = parseFloat(ethers.utils.formatUnits(fixedLender.smartPoolAssets, decimals));
        const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));
        const collateralFactor = parseFloat(
          ethers.utils.formatUnits(fixedLender.adjustFactor, decimals)
        );

        collateral += assets * oracle * collateralFactor;
      }

      fixedLender.maturityBorrowPositions.forEach((borrowPosition) => {
        const penaltyRate = parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, 18));
        const principal = parseFloat(
          ethers.utils.formatUnits(borrowPosition.position.principal, decimals)
        );
        const fee = parseFloat(ethers.utils.formatUnits(borrowPosition.position.fee, decimals));
        const maturityTimestamp = borrowPosition.maturity.toNumber();
        const currentTimestamp = new Date().getTime() / 1000;

        debt += principal + fee;
        if (maturityTimestamp > currentTimestamp) {
          debt += (currentTimestamp - maturityTimestamp) * penaltyRate;
        }
      });
    });

    if (collateral > 0 || debt > 0) {
      const healthFactorData = [
        {
          label: '',
          value: collateral,
          color: '#53D3BE'
        },
        {
          label: '',
          value: debt,
          color: '#4D4DE8'
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
          {walletAddress && (
            <>
              {
                <p className={styles.value}>
                  {depositData ? `$${totalDeposit?.toFixed(2)}` : <Skeleton />}
                </p>
              }
              {/* {<p className={styles.subvalue}>2.14% {translations[lang].apr}</p>} */}
            </>
          )}
          {!walletAddress && <p className={styles.disabledValue}>$0</p>}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart data={walletAddress && depositData ? depositData : notConnected} small />
          {walletAddress && depositData && (
            <div className={styles.detail}>
              {depositData.map((asset, key) => {
                if (totalDeposit === 0) return;
                return (
                  <Tooltip key={key} value={`$${asset.value.toFixed(2)}`} image={asset.image} />
                );
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
                <p className={styles.informationValue}>
                  {rateComposition && `${rateComposition.variableComposition}%`}
                </p>
              </div>
              <div className={styles.information}>
                <p className={styles.informationTitle}>
                  <span className={styles.fixed} />
                  {translations[lang].fixed}
                </p>
                <p className={styles.informationValue}>
                  {rateComposition && `${rateComposition.fixedComposition}%`}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart data={walletAddress && rateData ? rateData : notConnected} />
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.box}>
          <h3 className={styles.title}>
            {translations[lang].borrows} <Tooltip value={translations[lang].borrows} />
          </h3>
          {walletAddress ? (
            <>
              <p className={styles.value}>
                {borrowData ? `$${totalBorrow?.toFixed(2)}` : <Skeleton />}
              </p>
              {/* <p className={styles.subvalue}>2.14% {translations[lang].apr}</p> */}
            </>
          ) : (
            <p className={styles.disabledValue}>$0</p>
          )}
        </div>
        <div className={styles.chartContainer}>
          <DonutChart data={walletAddress && borrowData ? borrowData : notConnected} small />
          {walletAddress && borrowData && (
            <div className={styles.detail}>
              {borrowData.map((asset, key) => {
                if (totalBorrow === 0) return;
                return (
                  <Tooltip key={key} value={`$${asset.value.toFixed(2)}`} image={asset.image} />
                );
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
