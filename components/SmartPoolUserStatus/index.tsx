import { useContext, useEffect, useState } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AuditorContext from 'contexts/AuditorContext';
import FixedLenderContext from 'contexts/FixedLenderContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { SmartPoolItemData } from 'types/SmartPoolItemData';

import styles from './style.module.scss';

import keys from './translations.json';

import { getContractData } from 'utils/contracts';
import { getSymbol } from 'utils/utils';

type Props = {
  walletAddress: string | null | undefined;
  showModal: (data: Deposit | any, type: String) => void;
};

function SmartPoolUserStatus({ walletAddress, showModal }: Props) {
  const fixedLenders = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const auditor = useContext(AuditorContext);
  const { web3Provider, network } = useWeb3Context();
  const [itemData, setItemData] = useState<Array<SmartPoolItemData> | undefined>(undefined);

  const auditorContract = getContractData(
    network?.name,
    auditor.address!,
    auditor.abi!,
    web3Provider?.getSigner()
  );

  useEffect(() => {
    getCurrentBalance();
  }, [walletAddress]);

  async function getCurrentBalance() {
    try {
      const data = [];

      for (let i = 0; i < fixedLenders.length; i++) {
        const fixedLender = fixedLenders[i];

        const fixedLenderAddress = fixedLender.address;
        const fixedLenderAbi = fixedLender.abi;
        const fixedLenderSymbol = getSymbol(fixedLenderAddress!, network?.name);

        const contractData = await getContractData(
          network?.name,
          fixedLenderAddress!,
          fixedLenderAbi!
        );

        const balance = await contractData?.balanceOf(walletAddress);

        if (balance) {
          const etokens = balance;
          const tokens = await contractData?.convertToAssets(balance);

          const obj = {
            symbol: fixedLenderSymbol,
            eTokens: etokens,
            tokens: tokens
          };
          data.push(obj);
        }
      }

      setItemData(data);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>{translations[lang].walletBalance}</span>
            <span className={styles.title}>{translations[lang].currentBalance}</span>
            <span className={styles.title}>{translations[lang].eToken}</span>
            <span className={styles.title}>{translations[lang].collateral}</span>

            <span className={styles.title} />
          </div>

          {itemData
            ? itemData.map((item: SmartPoolItemData, key: number) => {
                return (
                  <Item
                    key={key}
                    tokenAmount={item.tokens}
                    symbol={item.symbol}
                    walletAddress={walletAddress}
                    eTokenAmount={item.eTokens}
                    showModal={showModal}
                    auditorContract={auditorContract}
                  />
                );
              })
            : fixedLenders.map((_, key: number) => {
                return (
                  <Item
                    key={key}
                    tokenAmount={undefined}
                    symbol={undefined}
                    walletAddress={undefined}
                    eTokenAmount={undefined}
                    showModal={() => undefined}
                    auditorContract={undefined}
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
}

export default SmartPoolUserStatus;
