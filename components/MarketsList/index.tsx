import { useContext, useEffect, useState } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import dynamic from 'next/dynamic';
import { captureMessage } from '@sentry/nextjs';

const Item = dynamic(() => import('components/MarketsList/Item'));
import Tooltip from 'components/Tooltip';

import { Market } from 'types/Market';
import { LangKeys } from 'types/Lang';
import { FixedMarketData } from 'types/FixedMarketData';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import PreviewerContext from 'contexts/PreviewerContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ContractsContext from 'contexts/ContractsContext';

import style from './style.module.scss';

import keys from './translations.json';

import formatMarkets from 'utils/formatMarkets';

import numbers from 'config/numbers.json';
const { usdAmount, maxAPYValue, minAPYValue } = numbers;

function MarketsList() {
  const previewerData = useContext(PreviewerContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);
  const { getInstance } = useContext(ContractsContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [markets, setMarkets] = useState<Market[]>([]);
  const [fixedMarketData, setFixedMarketData] = useState<FixedMarketData[] | undefined>(undefined);

  useEffect(() => {
    getPreviewFixed();
  }, [previewerData, accountData]);

  useEffect(() => {
    getMarkets();
  }, [accountData]);

  async function getMarkets() {
    if (!accountData) return;

    try {
      setMarkets(formatMarkets(accountData));
    } catch (e) {
      console.log(e);
    }
  }

  const checkWeirdAPY = (marketsData: any) => {
    if (!markets.length) return; // not ready to do the check yet

    const findings = [];
    // iterate through every market asset
    for (let index = 0; index < marketsData.length; index++) {
      const marketData = marketsData[index];
      const {
        borrows: borrowPools,
        deposits: depositPools,
        assets: initialAssets,
        market: marketAddress
      } = marketData;
      const { name: marketName } = markets.find(
        ({ market }) => market.toLowerCase() === marketAddress.toLowerCase()
      )!;
      // iterate through every borrow & deposit pools - parallel arrays
      for (let j = 0; j < borrowPools.length; j++) {
        const { assets: borrowFinalAssets, maturity: timestampEnd } = borrowPools[j];
        const { assets: depositFinalAssets } = depositPools[j];

        const timestampNow = new Date().getTime() / 1_000;

        // 31_536_000 = seconds in 1 year
        const timePerYear = 31_536_000 / (timestampEnd - timestampNow);

        const borrowRate = borrowFinalAssets.mul(parseFixed('1', 18)).div(initialAssets);
        const borrowFixedAPY = (Number(formatFixed(borrowRate, 18)) ** timePerYear - 1) * 100;

        const depositRate = depositFinalAssets.mul(parseFixed('1', 18)).div(initialAssets);
        const depositFixedAPY = (Number(formatFixed(depositRate, 18)) ** timePerYear - 1) * 100;

        if (depositFixedAPY > borrowFixedAPY) {
          findings.push(`Market: ${marketName} -> deposit APY > borrow APY.`);
        }

        if (depositFixedAPY > maxAPYValue || borrowFixedAPY > maxAPYValue) {
          findings.push(`Market: ${marketName} -> APY > ${maxAPYValue}%`);
        }

        if (depositFixedAPY < minAPYValue || borrowFixedAPY < minAPYValue) {
          findings.push(`Market: ${marketName} -> APY < ${minAPYValue}%`);
        }
      }
    }

    if (findings.length) {
      captureMessage(`Weird Fixed APYs | ${findings.join(' | ')}`);
    }
  };

  async function getPreviewFixed() {
    try {
      const previewerContract = getInstance(
        previewerData.address!,
        previewerData.abi!,
        'previewer'
      );

      const marketData = await previewerContract?.previewFixed(
        parseFixed(usdAmount.toString(), 18)
      );

      checkWeirdAPY(marketData);
      setFixedMarketData(marketData);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <section className={style.container}>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <div className={style.symbol}>{translations[lang].asset}</div>
            <div className={style.title}>{translations[lang].totalDeposits}</div>
            <div className={style.title}>
              {translations[lang].averageAPY}{' '}
              <Tooltip value={translations[lang].depositApyTooltip} orientation="down" />
            </div>
            <div className={style.title} />
          </div>
          {markets?.map((market, key) => {
            return (
              <Item market={market} key={key} type="deposit" fixedMarketData={fixedMarketData} />
            );
          })}
          {markets.length === 0 &&
            fixedLenderData.map((_, key) => {
              return <Item key={key} />;
            })}
        </div>
      </div>
      <div className={style.market}>
        <div className={style.column}>
          <div className={style.tableRow}>
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].totalBorrows}</span>
            <div className={style.title}>
              {translations[lang].averageAPY}{' '}
              <Tooltip value={translations[lang].borrowApyTooltip} orientation="down" />
            </div>
            <span className={style.title} />
          </div>
          {markets?.map((market, key) => {
            return (
              <Item market={market} key={key} type="borrow" fixedMarketData={fixedMarketData} />
            );
          })}
          {markets.length === 0 &&
            fixedLenderData.map((_, key) => {
              return <Item key={key} />;
            })}
        </div>
      </div>
    </section>
  );
}

export default MarketsList;
