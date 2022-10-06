import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import CircleIcon from '@mui/icons-material/Circle';

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

import getAssetColor from 'utils/getAssetColor';
import formatNumber from 'utils/formatNumber';

function DashboardUserCharts() {
  const { walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [depositData, setDepositData] = useState<Array<DonutData> | undefined>(undefined);
  const [borrowData, setBorrowData] = useState<Array<DonutData> | undefined>(undefined);

  const [totalDeposit, setTotalDeposit] = useState<number | undefined>(undefined);
  const [totalBorrow, setTotalBorrow] = useState<number | undefined>(undefined);

  const [depositRateComposition, setDepositRateComposition] = useState<
    Dictionary<number> | undefined
  >(undefined);
  const [borrowRateComposition, setBorrowRateComposition] = useState<
    Dictionary<number> | undefined
  >(undefined);

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
      const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));

      const objectDepositData: DonutData = {
        label: symbol.toUpperCase(),
        value: 0,
        color: getAssetColor(symbol),
        image: `/img/assets/${symbol.toLowerCase()}.svg`
      };

      const variablePoolDepositValue = parseFloat(
        ethers.utils.formatUnits(fixedLender.floatingDepositAssets, decimals)
      );
      const variablePoolDepositValueUSD = variablePoolDepositValue * oracle;

      objectDepositData.value += variablePoolDepositValueUSD; //add the value in USD to the asset deposit data
      allDepositsUSD += variablePoolDepositValueUSD; //add the value in USD to the total deposit
      variableComposition += variablePoolDepositValueUSD; //add the value in USD to the variable composition %

      fixedLender.fixedDepositPositions.forEach((supplyPosition) => {
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

      setDepositRateComposition({ variableComposition, fixedComposition });
    } else {
      setDepositRateComposition(undefined);
    }
  }

  function getBorrows() {
    if (!accountData) return;

    const data = Object.values(accountData);
    const borrowData: DonutData[] = [];
    let allBorrowsUSD = 0;
    let variableComposition = 0;
    let fixedComposition = 0;

    data.forEach((fixedLender) => {
      const symbol = fixedLender.assetSymbol;
      const decimals = fixedLender.decimals;
      const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));

      const objectBorrowData: DonutData = {
        label: symbol.toUpperCase(),
        value: 0,
        color: getAssetColor(symbol),
        image: `/img/assets/${symbol.toLowerCase()}.svg`
      };

      //floatinBorrow
      if (fixedLender.floatingBorrowAssets) {
        const variablePoolBorrowValue = parseFloat(
          ethers.utils.formatUnits(fixedLender.floatingBorrowAssets, decimals)
        );
        const variablePoolBorrowValueUSD = variablePoolBorrowValue * oracle;

        objectBorrowData.value += variablePoolBorrowValueUSD; //add the value in USD to the asset deposit data
        allBorrowsUSD += variablePoolBorrowValueUSD; //add the value in USD to the total deposit
        variableComposition += variablePoolBorrowValueUSD; //add the value in USD to the variable composition %
      }

      //fixed borrow
      fixedLender.fixedBorrowPositions.forEach((borrowPosition) => {
        const maturityBorrowValue = parseFloat(
          ethers.utils.formatUnits(borrowPosition.position.principal, decimals)
        );
        const maturityBorrowValueUSD = maturityBorrowValue * oracle;
        objectBorrowData.value += maturityBorrowValueUSD;
        allBorrowsUSD += maturityBorrowValueUSD;
        fixedComposition += maturityBorrowValueUSD;
      });

      if (objectBorrowData.value !== 0) borrowData.push(objectBorrowData);
    });

    allBorrowsUSD > 0 ? setBorrowData(borrowData) : setBorrowData(notConnected);
    allBorrowsUSD > 0 ? setTotalBorrow(allBorrowsUSD) : setTotalBorrow(0);

    //RATE DATA
    if (allBorrowsUSD !== 0) {
      const variable = (variableComposition * 100) / allBorrowsUSD;
      const fixed = (fixedComposition * 100) / allBorrowsUSD;

      variableComposition = parseFloat(variable.toFixed(2));
      fixedComposition = parseFloat(fixed.toFixed(2));

      setBorrowRateComposition({ variableComposition, fixedComposition });
    } else {
      setBorrowRateComposition(undefined);
    }
  }

  function getPercentage(assetUSD: number, totalUSD: number) {
    return ((assetUSD / totalUSD) * 100).toFixed(2);
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.subContainer}>
          <div className={styles.chartContainer}>
            <DonutChart data={walletAddress && depositData ? depositData : notConnected} small />
          </div>
          <div className={styles.box}>
            <h3 className={styles.title}>{translations[lang].deposits}</h3>
            {walletAddress && depositData && (
              <div className={styles.detailList}>
                {depositData.map((asset, key) => {
                  if (!totalDeposit || totalDeposit === 0) return;
                  return (
                    <Tooltip
                      key={key}
                      value={`$${formatNumber(asset.value, 'USD', true)}`}
                      disableImage
                    >
                      <div className={styles.detail}>
                        <CircleIcon
                          sx={{
                            color: `${getAssetColor(asset.label || 'WBTC')}`,
                            fontSize: '8px',
                            alignSelf: 'center'
                          }}
                        />
                        <code>
                          {asset.label} {getPercentage(asset.value, totalDeposit)}%
                        </code>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={styles.line}>
            {depositRateComposition ? (
              <div
                className={styles.fullProgress}
                style={{ width: `${depositRateComposition.variableComposition}%` }}
              />
            ) : (
              <div className={styles.fullProgress} style={{ width: `100%` }} />
            )}
          </div>
          <div className={styles.composition}>
            <span>
              <CircleIcon
                sx={{
                  color: `#008cf4`,
                  fontSize: '8px',
                  alignSelf: 'center'
                }}
              />
              <code>
                {' '}
                Variable{' '}
                {depositRateComposition ? (
                  depositRateComposition.variableComposition + '%'
                ) : (
                  <Skeleton width={15} />
                )}
              </code>
            </span>
            <span>
              <CircleIcon
                sx={{
                  color: `#331A53`,
                  fontSize: '8px',
                  alignSelf: 'center'
                }}
              />
              <code>
                {' '}
                Fixed{' '}
                {depositRateComposition ? (
                  depositRateComposition.fixedComposition + '%'
                ) : (
                  <Skeleton width={15} />
                )}
              </code>
            </span>
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.subContainer}>
          <div className={styles.chartContainer}>
            <DonutChart data={walletAddress && borrowData ? borrowData : notConnected} small />
          </div>
          <div className={styles.box}>
            <h3 className={styles.title}>{translations[lang].borrows}</h3>
            {walletAddress && borrowData && (
              <div className={styles.detailList}>
                {borrowData.map((asset, key) => {
                  if (!totalBorrow || totalBorrow === 0) return;
                  return (
                    <Tooltip
                      key={key}
                      value={`$${formatNumber(asset.value, 'USD', true)}`}
                      disableImage
                    >
                      <div className={styles.detail}>
                        <CircleIcon
                          sx={{
                            color: `${getAssetColor(asset.label || 'WBTC')}`,
                            fontSize: '8px',
                            alignSelf: 'center'
                          }}
                        />
                        <code>
                          {asset.label} {getPercentage(asset.value, totalBorrow)}%
                        </code>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={styles.line}>
            {borrowRateComposition ? (
              <div
                className={styles.fullProgress}
                style={{ width: `${borrowRateComposition.variableComposition}0%` }}
              />
            ) : (
              <div className={styles.fullProgress} style={{ width: `100%` }} />
            )}
          </div>
          <div className={styles.composition}>
            <span>
              <CircleIcon
                sx={{
                  color: `#008cf4`,
                  fontSize: '8px',
                  alignSelf: 'center'
                }}
              />
              <code>
                {' '}
                Variable{' '}
                {borrowRateComposition ? (
                  borrowRateComposition.variableComposition + '%'
                ) : (
                  <Skeleton width={15} />
                )}
              </code>
            </span>
            <span>
              <CircleIcon
                sx={{
                  color: `#331A53`,
                  fontSize: '8px',
                  alignSelf: 'center'
                }}
              />
              <code>
                {' '}
                Fixed{' '}
                {borrowRateComposition ? (
                  borrowRateComposition.fixedComposition + '%'
                ) : (
                  <Skeleton width={15} />
                )}
              </code>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardUserCharts;
