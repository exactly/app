import { useContext, useEffect, useState } from 'react';
import { ethers, Contract, BigNumber } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import { Option } from 'react-dropdown';

import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Decimals } from 'types/Decimals';

import styles from './style.module.scss';

import keys from './translations.json';

import decimals from 'config/decimals.json';

import { getSymbol, getUnderlyingData } from 'utils/utils';
import { getContractData } from 'utils/contracts';
import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';

type Props = {
  symbol: string | undefined;
  depositAmount: BigNumber | undefined;
  borrowedAmount: BigNumber | undefined;
  walletAddress: string | null | undefined;
  showModal: (data: Deposit | any, type: String) => void | undefined;
  eTokenAmount: BigNumber | undefined;
  auditorContract: Contract | undefined;
  type: Option | undefined;
};

function Item({
  symbol,
  depositAmount,
  borrowedAmount,
  walletAddress,
  showModal,
  eTokenAmount,
  auditorContract,
  type
}: Props) {
  const { network, web3Provider } = useWeb3Context();
  const fixedLender = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const { accountData } = useContext(AccountDataContext);

  const translations: { [key: string]: LangKeys } = keys;

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<string | undefined>(undefined);
  const [rate, setRate] = useState<number | undefined>(undefined);

  const underlyingData = getUnderlyingData(network?.name, symbol);

  useEffect(() => {
    getCurrentBalance();
  }, [underlyingData, walletAddress, accountData]);

  useEffect(() => {
    if (accountData) {
      checkCollaterals();
      getExchangeRate();
    }
  }, [accountData, walletAddress]);

  async function checkCollaterals() {
    if (!accountData || !symbol) return;

    const data = accountData;

    data![symbol].isCollateral ? setToggle(true) : setToggle(false);
  }

  function getExchangeRate() {
    if (!accountData || !symbol) return;
    const data = accountData;
    const exchangeRate = parseFloat(
      ethers.utils.formatEther(data[symbol.toUpperCase()].oraclePrice)
    );
    setRate(exchangeRate);
  }

  async function getCurrentBalance() {
    if (!walletAddress || !symbol) return;

    let balance;
    let decimals;

    if (symbol == 'WETH') {
      balance = await web3Provider?.getBalance(walletAddress!);
      decimals = 18;
    } else {
      const contractData = await getContractData(
        network?.name,
        underlyingData!.address,
        underlyingData!.abi
      );

      decimals = await contractData?.decimals();

      balance = await contractData?.balanceOf(walletAddress);
    }

    if (balance) {
      setWalletBalance(ethers.utils.formatUnits(balance, decimals));
    }
  }

  function getFixedLenderData() {
    const filteredFixedLender = fixedLender.find((contract) => {
      const contractSymbol = getSymbol(contract.address!, network!.name);

      return contractSymbol === symbol;
    });

    const fixedLenderData = {
      address: filteredFixedLender?.address,
      abi: filteredFixedLender?.abi
    };

    return fixedLenderData;
  }

  async function handleMarket() {
    try {
      let tx;

      setLoading(true);

      const fixedLenderAddress = getFixedLenderData().address;

      if (!toggle && fixedLenderAddress) {
        //if it's not toggled we need to ENTER
        tx = await auditorContract?.enterMarket(fixedLenderAddress);
      } else if (fixedLenderAddress) {
        //if it's toggled we need to EXIT
        tx = await auditorContract?.exitMarket(fixedLenderAddress);
      }

      //waiting for tx to end
      await tx.wait();
      setToggle(!toggle);
      //when it ends we stop loading
      setLoading(false);
    } catch (e) {
      console.log(e);
      //if user rejects tx we change toggle status to previous, and stop loading
      setToggle((prev) => !prev);
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        {(symbol && (
          <img
            src={`/img/assets/${symbol.toLowerCase()}.png`}
            alt={symbol}
            className={styles.assetImage}
          />
        )) || <Skeleton circle height={40} width={40} />}
        <span className={styles.primary}>{(symbol && parseSymbol(symbol)) || <Skeleton />}</span>
      </div>
      <span className={styles.value}>
        {(symbol &&
          rate &&
          walletBalance &&
          `$${formatNumber(parseFloat(walletBalance!) * rate, 'usd')}`) || <Skeleton width={40} />}
      </span>
      <span className={styles.value}>
        {(depositAmount &&
          borrowedAmount &&
          symbol &&
          rate &&
          `$${formatNumber(
            parseFloat(
              ethers.utils.formatUnits(
                type?.value == 'deposit' ? depositAmount : borrowedAmount,
                decimals[symbol! as keyof Decimals]
              )
            ) * rate,
            'USD',
            true
          )}`) || <Skeleton width={40} />}
      </span>
      {type?.value == 'deposit' && (
        <>
          <span className={styles.value}>
            {(eTokenAmount &&
              symbol &&
              `${formatNumber(
                ethers.utils.formatUnits(eTokenAmount, decimals[symbol! as keyof Decimals]),
                symbol
              )}`) || <Skeleton width={40} />}{' '}
          </span>

          {symbol ? (
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
          ) : (
            <span className={styles.value}>
              <Skeleton width={40} />
            </span>
          )}
        </>
      )}

      <div className={styles.actions}>
        <div className={styles.buttonContainer}>
          {(symbol && type && (
            <Button
              text={
                type.value == 'deposit' ? translations[lang].deposit : translations[lang].borrow
              }
              className={type.value == 'deposit' ? 'primary' : 'secondary'}
              onClick={() =>
                showModal(
                  {
                    market: getFixedLenderData().address,
                    symbol
                  },
                  type.value == 'deposit' ? 'smartDeposit' : 'floatingBorrow'
                )
              }
            />
          )) || <Skeleton height={40} />}
        </div>

        <div className={styles.buttonContainer}>
          {(symbol && type && (
            <Button
              text={
                type.value == 'deposit' ? translations[lang].withdraw : translations[lang].repay
              }
              className={type.value == 'deposit' ? 'tertiary' : 'quaternary'}
              onClick={() =>
                showModal(
                  {
                    assets: depositAmount,
                    symbol
                  },
                  type.value == 'deposit' ? 'withdrawSP' : 'floatingRepay'
                )
              }
            />
          )) || <Skeleton height={40} />}
        </div>
      </div>
    </div>
  );
}

export default Item;
