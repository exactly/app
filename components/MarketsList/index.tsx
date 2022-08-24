import { useContext, useEffect, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';

import Item from 'components/MarketsList/Item';

import { Market } from 'types/Market';
import { LangKeys } from 'types/Lang';
import { FixedMarketData } from 'types/FixedMarketData';

import LangContext from 'contexts/LangContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';
import AccountDataContext from 'contexts/AccountDataContext';

import style from './style.module.scss';

import keys from './translations.json';

import { getContractData } from 'utils/contracts';
import formatMarkets from 'utils/formatMarkets';

import numbers from 'config/numbers.json';

function MarketsList() {
  const { network } = useWeb3Context();

  const previewerData = useContext(PreviewerContext);
  const fixedLenderData = useContext(FixedLenderContext);
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [markets, setMarkets] = useState<Market[]>([]);
  const [fixedMarketData, setFixedMarketData] = useState<FixedMarketData[] | undefined>(undefined);

  useEffect(() => {
    getPreviewFixed();
  }, [network, previewerData]);

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
      const previewerContract = getContractData(
        network?.name!,
        previewerData.address!,
        previewerData.abi!
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
            <span className={style.symbol}>{translations[lang].asset}</span>
            <span className={style.title}>{translations[lang].totalDeposits}</span>
            <span className={style.title}>{translations[lang].averageAPY}</span>
            <span className={style.title} />
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
            <span className={style.title}>{translations[lang].averageAPY}</span>
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
