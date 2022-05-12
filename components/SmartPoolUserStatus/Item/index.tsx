import { useContext, useEffect, useState } from 'react';
import { ethers, Contract } from 'ethers';
import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';

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
  auditorContract: Contract | undefined;
};

function Item({ symbol, amount, walletAddress, showModal, deposit, auditorContract }: Props) {
  const fixedLender = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);

  const underlyingData = getUnderlyingData(process.env.NEXT_PUBLIC_NETWORK!, symbol);

  useEffect(() => {
    getCurrentBalance();
  }, []);

  useEffect(() => {
    if (auditorContract) {
      checkCollaterals();
    }
  });

  async function checkCollaterals() {
    const fixedLenderAddress = getFixedLenderAddress();
    const allMarkets = await auditorContract?.getAllMarkets();
    const marketIndex = allMarkets.indexOf(fixedLenderAddress);
    const assets = await auditorContract?.accountAssets(walletAddress);

    /**
     * "assets" is a bitMap
     * "marketIndex" is the index of the market we want to check if has collateral
     * with "<<" (leftshift) we check if the bit in the marketIndex is 0 or not
     * if its 0 dosen't enter the market is different to 0 has enter the market
     */

    !assets.and(1 << marketIndex).eq(0) ? setToggle(true) : setToggle(false);
  }

  async function getCurrentBalance() {
    const contractData = await getContractData(underlyingData!.address, underlyingData!.abi);
    const balance = await contractData?.balanceOf(walletAddress);

    if (balance) {
      setWalletBalance(ethers.utils.formatEther(balance));
    }
  }

  function getFixedLenderAddress() {
    const filteredFixedLender = fixedLender.find((contract) => {
      const args: Array<string> | undefined = contract?.args;
      const contractSymbol: string | undefined = args && args[1];

      return contractSymbol === symbol;
    });

    const fixedLenderAddress = filteredFixedLender?.address;

    return fixedLenderAddress;
  }

  async function handleMarket() {
    try {
      let tx;

      setLoading(true);

      const fixedLenderAddress = getFixedLenderAddress();

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
            <Loading size="small" color="primary" />
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
