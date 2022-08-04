import { useContext, useEffect, useState } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AuditorContext from 'contexts/AuditorContext';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { SmartPoolItemData } from 'types/SmartPoolItemData';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import { getContractData } from 'utils/contracts';

type Props = {
  walletAddress: string | null | undefined;
  showModal: (data: Deposit | any, type: String) => void;
  type: Option;
};

function SmartPoolUserStatus({ walletAddress, showModal, type }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const auditor = useContext(AuditorContext);
  const { web3Provider, network } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const [itemData, setItemData] = useState<Array<SmartPoolItemData> | undefined>(undefined);

  const auditorContract = getContractData(
    network?.name,
    auditor.address!,
    auditor.abi!,
    web3Provider?.getSigner()
  );

  useEffect(() => {
    getCurrentBalance();
  }, [walletAddress, accountData]);

  function getCurrentBalance() {
    if (!accountData) return;
    const allMarkets = Object.values(accountData);

    const data: SmartPoolItemData[] = [];

    allMarkets.forEach((market) => {
      const symbol = market.assetSymbol;
      const depositBalance = market.floatingDepositAssets;
      const eTokens = market.floatingDepositShares;
      const borrowBalance = market.floatingBorrowAssets;

      const obj = {
        symbol: symbol,
        eTokens: eTokens,
        depositedAmount: depositBalance,
        borrowedAmount: borrowBalance
      };
      data.push(obj);
    });

    setItemData(data);
  }

  return (
    <div className={styles.container}>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>{translations[lang].walletBalance}</span>
            <span className={styles.title}>
              {type.value == 'deposit'
                ? translations[lang].currentBalance
                : translations[lang].borrowBalance}
            </span>
            {type.value == 'deposit' && (
              <>
                <span className={styles.title}>{translations[lang].eToken}</span>
                <span className={styles.title}>{translations[lang].collateral}</span>
              </>
            )}

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
                    showModal={showModal}
                    auditorContract={auditorContract}
                    type={type}
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
                    showModal={() => undefined}
                    auditorContract={undefined}
                    type={undefined}
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
}

export default SmartPoolUserStatus;
