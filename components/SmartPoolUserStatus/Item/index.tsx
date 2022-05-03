import { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';

import AuditorContext from 'contexts/AuditorContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Decimals } from 'types/Decimals';

import styles from './style.module.scss';

import keys from './translations.json';

import decimals from 'config/decimals.json';

import { getUnderlyingData } from 'utils/utils';
import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';

type Props = {
  symbol: string;
  amount: string;
  walletAddress: string | null | undefined;
  showModal: (data: Deposit, type: String) => void;
  deposit: Deposit;
};

function Item({ symbol, amount, walletAddress, showModal, deposit }: Props) {
  const { web3Provider } = useWeb3Context();
  const auditor = useContext(AuditorContext);
  const fixedLender = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);

  const auditorContract = getContractData(
    auditor.address!,
    auditor.abi!,
    web3Provider?.getSigner()
  );

  const underlyingData = getUnderlyingData(process.env.NEXT_PUBLIC_NETWORK!, symbol);

  useEffect(() => {
    getCurrentBalance();
  }, []);

  async function getCurrentBalance() {
    const contractData = await getContractData(underlyingData!.address, underlyingData!.abi);
    const balance = await contractData?.balanceOf(walletAddress);

    if (balance) {
      setWalletBalance(ethers.utils.formatEther(balance));
    }
  }

  async function handleMarket() {
    try {
      let tx;

      setLoading(true);

      const filteredFixedLender = fixedLender.find((contract) => {
        const args: Array<string> | undefined = contract?.args;
        const contractSymbol: string | undefined = args && args[1];

        return contractSymbol === symbol;
      });

      const fixedLenderAddress = filteredFixedLender?.address;

      if (!toggle && fixedLenderAddress) {
        //if it's not toggled we need to ENTER
        tx = await auditorContract?.enterMarkets([fixedLenderAddress]);
      } else if (fixedLenderAddress) {
        //if it's toggled we need to EXIT
        tx = await auditorContract?.exitMarket(fixedLenderAddress);
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
        <img
          src={`/img/assets/${symbol.toLowerCase()}.png`}
          alt={symbol}
          className={styles.assetImage}
        />
        <span className={styles.primary}>{symbol}</span>
      </div>
      <span className={styles.value}>{formatNumber(walletBalance!, symbol)}</span>
      <span className={styles.value}>
        {formatNumber(
          ethers.utils.formatUnits(amount, decimals[symbol! as keyof Decimals]),
          symbol
        )}
      </span>
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
          <div className={styles.loadingContainer}>
            <Loading size="small" />
          </div>
        )}
      </span>
      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          <Button
            text={translations[lang].deposit}
            className="primary"
            onClick={() =>
              showModal(
                { ...deposit, assets: JSON.stringify(deposit.assets), symbol },
                'smartDeposit'
              )
            }
          />
        </div>

        <div className={styles.buttonContainer}>
          <Button
            text={translations[lang].withdraw}
            className="tertiary"
            onClick={() =>
              showModal(
                { ...deposit, assets: JSON.stringify(deposit.assets), symbol },
                'withdrawSP'
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Item;
