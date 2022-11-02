import type { Contract } from '@ethersproject/contracts';
import React, { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Item = dynamic(() => import('./Item'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import LangContext from 'contexts/LangContext';
import AuditorContext from 'contexts/AuditorContext';
import AccountDataContext from 'contexts/AccountDataContext';
import ContractsContext from 'contexts/ContractsContext';

import { LangKeys } from 'types/Lang';
import { SmartPoolItemData } from 'types/SmartPoolItemData';
import { Option } from 'react-dropdown';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  walletAddress: string | null | undefined;
  type: Option;
};

function SmartPoolUserStatus({ walletAddress, type }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const auditor = useContext(AuditorContext);
  const { accountData } = useContext(AccountDataContext);
  const { getInstance } = useContext(ContractsContext);

  const [itemData, setItemData] = useState<Array<SmartPoolItemData> | undefined>(undefined);
  const [auditorContract, setAuditorContract] = useState<Contract | undefined>(undefined);

  const orderAssets = ['DAI', 'USDC', 'WETH', 'WBTC', 'wstETH'];

  useEffect(() => {
    getCurrentBalance();
  }, [walletAddress, accountData, type]);

  useEffect(() => {
    getAuditorContract();
  }, [auditor]);

  function getAuditorContract() {
    const auditorContract = getInstance(auditor.address!, auditor.abi!, 'auditor');
    setAuditorContract(auditorContract);
  }

  function getCurrentBalance() {
    if (!accountData) return;

    const allMarkets = Object.values(accountData).sort((a: FixedLenderAccountData, b: FixedLenderAccountData) => {
      return orderAssets.indexOf(a.assetSymbol) - orderAssets.indexOf(b.assetSymbol);
    });

    const data: SmartPoolItemData[] = [];

    allMarkets.forEach((market) => {
      const symbol = market.assetSymbol;
      const depositBalance = market.floatingDepositAssets;
      const eTokens = market.floatingDepositShares;
      const borrowBalance = market.floatingBorrowAssets;
      const address = market.market;

      const obj = {
        symbol: symbol,
        eTokens: eTokens,
        depositedAmount: depositBalance,
        borrowedAmount: borrowBalance,
        market: address,
      };

      data.push(obj);
    });

    setItemData(data);
  }

  return (
    <div className={styles.container}>
      {itemData && itemData.length ? (
        <div className={styles.market}>
          <div className={styles.column}>
            <div className={styles.tableRow}>
              <span className={styles.symbol}>{translations[lang].asset}</span>

              <span className={styles.title}>{translations[lang].netAssetValue}</span>

              {type.value === 'deposit' && <span className={styles.title}>{translations[lang].eToken}</span>}

              {type.value === 'deposit' && <span className={styles.title}>{translations[lang].collateral}</span>}

              <span className={styles.title} />
            </div>

            {itemData
              ? itemData.map((item: SmartPoolItemData, key: number) => {
                  return (
                    <Item
                      key={key}
                      depositAmount={item.depositedAmount}
                      borrowedAmount={item.borrowedAmount}
                      symbol={item.symbol}
                      walletAddress={walletAddress}
                      eTokenAmount={item.eTokens}
                      auditorContract={auditorContract}
                      type={type}
                      market={item.market}
                    />
                  );
                })
              : accountData &&
                Object.keys(accountData).map((_, key: number) => {
                  return (
                    <Item
                      key={key}
                      depositAmount={undefined}
                      borrowedAmount={undefined}
                      symbol={undefined}
                      walletAddress={undefined}
                      eTokenAmount={undefined}
                      auditorContract={undefined}
                      type={undefined}
                      market={undefined}
                    />
                  );
                })}
          </div>
        </div>
      ) : itemData && !itemData.length ? (
        <EmptyState connected tab={type.value} />
      ) : (
        !itemData && (
          <div className={styles.market}>
            <div className={styles.column}>
              <div className={styles.tableRow}>
                <span className={styles.symbol}>{translations[lang].asset}</span>
                <span className={styles.title}>
                  {type.value === 'deposit' ? translations[lang].currentBalance : translations[lang].borrowBalance}
                </span>
                {type.value === 'deposit' && (
                  <>
                    <span className={styles.title}>{translations[lang].eToken}</span>
                    <span className={styles.title}>{translations[lang].collateral}</span>
                  </>
                )}

                <span className={styles.title} />
              </div>

              {orderAssets.map((_, key: number) => {
                return (
                  <Item
                    key={key}
                    depositAmount={undefined}
                    borrowedAmount={undefined}
                    symbol={undefined}
                    walletAddress={undefined}
                    eTokenAmount={undefined}
                    auditorContract={undefined}
                    type={undefined}
                    market={undefined}
                  />
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default SmartPoolUserStatus;
