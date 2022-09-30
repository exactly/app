import { useContext, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import Button from 'components/common/Button';

import formatMarkets from 'utils/formatMarkets';
import formatNumber from 'utils/formatNumber';
import getSubgraph from 'utils/getSubgraph';
import queryRates from 'utils/queryRates';

function VariableTable() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { accountData } = useContext(AccountDataContext);
  const { network } = useWeb3Context();

  const [rates, setRates] = useState<Record<string, Record<string, string>> | undefined>(undefined);

  const markets = useMemo(() => {
    return getMarkets();
  }, [accountData]);

  useEffect(() => {
    getRates();
  }, [markets, accountData]);

  function getMarkets() {
    if (!accountData) return [];

    return formatMarkets(accountData);
  }

  async function getRates() {
    if (!markets || !accountData) return;

    try {
      const subgraphUrl = getSubgraph(network?.name!);

      const promises: any = [];

      markets.forEach(async (market) => {
        let depositInterestRate;
        let borrowInterestRate;

        const maxFuturePools = accountData[market?.symbol.toUpperCase()].maxFuturePools;

        const depositData = await queryRates(subgraphUrl, market.market, 'deposit', {
          maxFuturePools
        });

        depositInterestRate = depositData[0].rate.toFixed(2);

        const borrowData = await queryRates(subgraphUrl, market.market, 'borrow');

        borrowInterestRate = borrowData[0].rate.toFixed(2);

        const marketRates = {
          [market.symbol]: {
            deposit: 'N/A',
            borrow: 'N/A'
          }
        };

        if (depositInterestRate) {
          marketRates[market.symbol].deposit = depositInterestRate;
        }

        if (borrowInterestRate) {
          marketRates[market.symbol].borrow = borrowInterestRate;
        }

        promises.push(marketRates);
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <section className={styles.table}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{translations[lang].asset.toUpperCase()}</th>
            <th scope="col">{translations[lang].totalDeposited.toUpperCase()}</th>
            <th scope="col">{translations[lang].totalBorrowed.toUpperCase()}</th>
            <th scope="col">{translations[lang].depositAPY.toUpperCase()}</th>
            <th scope="col">{translations[lang].borrowAPY.toUpperCase()}</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {markets.map((market, key) => {
            return (
              <tr key={key}>
                <td>
                  <Image
                    src={`/img/assets/${market.name.toLowerCase()}.svg`}
                    width={40}
                    height={40}
                    alt={market.symbol}
                  />
                  <p className={styles.marketName}>{market.name == 'WETH' ? 'ETH' : market.name}</p>
                </td>
                <td>${formatNumber(market.supplied as string, 'USD')}</td>
                <td>${formatNumber(market.borrowed as string, 'USD')}</td>
                {/* <td>{rates?[market.symbol]}</td> */}
                <td>b</td>
                <td>
                  <Link
                    href={`/assets/${market.name == 'WETH' ? 'eth' : market.name.toLowerCase()}`}
                  >
                    <Button text="Details" className="white" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default VariableTable;
