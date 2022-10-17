import { useContext, useEffect, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';

import LangContext from 'contexts/LangContext';
import { MarketContext } from 'contexts/AddressContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ContractsContext from 'contexts/ContractsContext';

import Tooltip from 'components/Tooltip';

import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';
import { FixedMarketData } from 'types/FixedMarketData';

import styles from './style.module.scss';

import keys from './translations.json';

import Item from './Item';

import numbers from 'config/numbers.json';

interface Props {
  page: number;
  itemsPerPage: number;
  symbol: string;
  deposits: Array<Maturity> | undefined;
  borrows: Array<Maturity> | undefined;
}

function AssetTable({ page, itemsPerPage, symbol, deposits, borrows }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);
  const { dates } = useContext(MarketContext);
  const previewerData = useContext(PreviewerContext);
  const { getInstance } = useContext(ContractsContext);

  const [fixedMarketData, setFixedMarketData] = useState<FixedMarketData[] | undefined>(undefined);

  useEffect(() => {
    getPreviewFixed();
  }, [network, previewerData, accountData]);

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
    <div className={styles.table}>
      <div className={styles.row}>
        <div className={styles.maturity}>{translations[lang].maturity}</div>
        <div className={styles.lastFixedRate}>
          <div className={styles.apr}>
            {translations[lang].apr}{' '}
            <Tooltip value={translations[lang].aprTooltip} orientation="down" />
          </div>
        </div>
        <div className={styles.actions}></div>
      </div>
      {dates && (
        <>
          {dates
            ?.slice(itemsPerPage * (page - 1), itemsPerPage * page)
            .map((maturity: Maturity, key: number) => {
              return (
                <Item
                  key={key}
                  symbol={symbol}
                  maturity={maturity}
                  deposits={deposits}
                  borrows={borrows}
                  fixedMarketData={fixedMarketData}
                />
              );
            })}
        </>
      )}
      {!dates &&
        Array(3)
          .fill('a')
          .map((_, key: number) => {
            return (
              <Item
                key={key}
                symbol={symbol}
                maturity={undefined}
                deposits={undefined}
                borrows={undefined}
                fixedMarketData={undefined}
              />
            );
          })}
    </div>
  );
}

export default AssetTable;
