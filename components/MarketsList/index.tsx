import { useContext, useEffect, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import dynamic from 'next/dynamic';

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

  async function getPreviewFixed() {
    try {
      const previewerContract = getInstance(
        previewerData.address!,
        previewerData.abi!,
        'previewer'
      );

      const data = await previewerContract?.previewFixed(
        parseFixed(numbers.usdAmount.toString(), 18)
      );

      setFixedMarketData(data);
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
