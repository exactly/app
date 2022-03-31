import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';

import AuditorContext from 'contexts/AuditorContext';
import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';

import styles from './style.module.scss';

import keys from './translations.json';

import useContractWithSigner from 'hooks/useContractWithSigner';
import { getUnderlyingData } from 'utils/utils';
import { getContractData } from 'utils/contracts';

type Props = {
  symbol: string;
  amount: string;
  walletAddress: string | null | undefined;
  showModal: (data: Deposit, type: String) => void;
  deposit: Deposit;
};

function Item({ symbol, amount, walletAddress, showModal, deposit }: Props) {
  const auditor = useContext(AuditorContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const auditorContract = useContractWithSigner(auditor.address!, auditor.abi!);
  const underlyingData = getUnderlyingData(process.env.NEXT_PUBLIC_NETWORK!, symbol);

  useEffect(() => {
    getCurrentBalance();
  }, []);

  async function getCurrentBalance() {
    const contractData = await getContractData(underlyingData!.address, underlyingData!.abi, false);
    const balance = await contractData?.balanceOf(walletAddress);

    if (balance) {
      setWalletBalance(ethers.utils.formatEther(balance));
    }
  }

  async function handleMarket() {
    try {
      let tx;

      setLoading(true);

      if (!toggle) {
        //if it's untoggled we need to ENTER
        tx = await auditorContract.contractWithSigner?.enterMarkets([
          '0xe9A7A6886f1577c280CFEbb116fF5859Aa65bdA1'
        ]);
      } else {
        //if it's toggled we need to EXIT
        tx = await auditorContract.contractWithSigner?.exitMarket(
          '0xe9A7A6886f1577c280CFEbb116fF5859Aa65bdA1'
        );
      }

      //waiting for tx to end
      await tx.wait();

      //when it ends we stop loading
      setLoading(false);
    } catch (e) {
      //if user rejects tx we change toggle status to previous, and stop loading
      setToggle((prev) => !prev);
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <img src={`/img/assets/${symbol.toLowerCase()}.png`} className={styles.assetImage} />
        <span className={styles.primary}>{symbol}</span>
      </div>
      <span className={styles.value}>{walletBalance}</span>
      <span className={styles.value}>{ethers.utils.formatUnits(amount, 18)}</span>
      <span className={styles.value}>{0}</span>

      <span className={styles.value}>
        {!loading ? (
          <Switch
            isOn={toggle}
            handleToggle={() => {
              setToggle((prev) => !prev);
              handleMarket();
            }}
            id={underlyingData?.address || Math.random().toString()}
            disabled={disabled}
          />
        ) : (
          <Loading size="small" />
        )}
      </span>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          <Button text={translations[lang].deposit} className="primary" />
        </div>

        <div className={styles.buttonContainer}>
          <Button
            text={translations[lang].withdraw}
            className="tertiary"
            onClick={() =>
              showModal({ ...deposit, amount: JSON.stringify(deposit.amount) }, 'withdrawSP')
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Item;
