import { useContext, useEffect, useState } from 'react';
import { ethers, Contract, BigNumber } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import request from 'graphql-request';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import Image from 'next/image';

import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';
import Tooltip from 'components/Tooltip';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';

import { LangKeys } from 'types/Lang';
import { Decimals } from 'types/Decimals';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import decimals from 'config/decimals.json';

import { getSymbol, getUnderlyingData } from 'utils/utils';
import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';
import getSubgraph from 'utils/getSubgraph';
import getHealthFactorData from 'utils/getHealthFactorData';
import parseHealthFactor from 'utils/parseHealthFactor';

import { getSmartPoolDepositsAndWithdraws, getSmartPoolBorrowsAndRepays } from 'queries';

type Props = {
  symbol: string | undefined;
  depositAmount: BigNumber | undefined;
  borrowedAmount: BigNumber | undefined;
  walletAddress: string | null | undefined;
  eTokenAmount: BigNumber | undefined;
  auditorContract: Contract | undefined;
  type: Option | undefined;
  market: string | undefined;
};

function Item({
  symbol,
  depositAmount,
  borrowedAmount,
  walletAddress,
  eTokenAmount,
  auditorContract,
  type,
  market
}: Props) {
  const { network } = useWeb3Context();
  const fixedLender = useContext(FixedLenderContext);
  const lang: string = useContext(LangContext);
  const { accountData } = useContext(AccountDataContext);
  const { setModalContent, setOpen } = useContext(ModalStatusContext);

  const translations: { [key: string]: LangKeys } = keys;

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [rate, setRate] = useState<number | undefined>(undefined);
  const [originalAmount, setOriginalAmount] = useState<string | undefined>(undefined);
  const [difference, setDifference] = useState<string | undefined>(undefined);
  const [disabledText, setDisabledText] = useState<string | undefined>(undefined);

  const underlyingData = getUnderlyingData(network?.name, symbol);

  useEffect(() => {
    getOriginalAmount();
  }, [accountData, walletAddress, type, symbol, borrowedAmount, depositAmount]);

  useEffect(() => {
    if (accountData) {
      checkCollaterals();
      getExchangeRate();
    }
  }, [accountData, walletAddress]);

  async function checkCollaterals() {
    if (!accountData || !symbol) return;

    const floatingPositions = accountData[symbol].floatingBorrowAssets;
    const fixedPositions = accountData[symbol].fixedBorrowPositions;

    if (!floatingPositions.isZero() || fixedPositions.length > 0) {
      setDisabledText('activeBorrow');
      setDisabled(true);
    }

    if (accountData[symbol].isCollateral) {
      setToggle(true);

      const healthFactor = await getHealthFactorData(accountData);
      const oraclePrice = accountData[symbol].oraclePrice;
      const collateralAssets = accountData[symbol].floatingDepositAssets;
      const WAD = parseFixed('1', 18);
      const collateralUsd = collateralAssets.mul(oraclePrice).div(WAD);

      const newHF = parseFloat(
        parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(collateralUsd))
      );

      if (newHF < 1) {
        setDisabledText('underCollateral');
      }
    }
  }

  function getExchangeRate() {
    if (!accountData || !symbol) return;
    const data = accountData;
    const exchangeRate = parseFloat(
      ethers.utils.formatEther(data[symbol.toUpperCase()].oraclePrice)
    );
    setRate(exchangeRate);
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

  async function getOriginalAmount() {
    if (!network || !walletAddress || !accountData || !symbol || !market || !type) return;

    setOriginalAmount(undefined);
    setDifference(undefined);

    const subgraphUrl = getSubgraph(network.name);

    const decimals = accountData[symbol].decimals;

    let amount;

    let totalIncremental = parseFixed('0', decimals);

    let totalDecremental = parseFixed('0', decimals);

    try {
      if (type.value == 'deposit') {
        const smartPoolDepositsAndWithdraws = await request(
          subgraphUrl,
          getSmartPoolDepositsAndWithdraws(walletAddress, market)
        );

        smartPoolDepositsAndWithdraws.deposits.forEach((deposit: any) => {
          totalIncremental = totalIncremental.add(parseFixed(deposit.assets));
        });

        smartPoolDepositsAndWithdraws.withdraws.forEach((withdraw: any) => {
          totalDecremental = totalDecremental.add(parseFixed(withdraw.assets));
        });
      }

      if (type.value == 'borrow') {
        const smartPoolBorrowsAndRepays = await request(
          subgraphUrl,
          getSmartPoolBorrowsAndRepays(walletAddress, market)
        );

        smartPoolBorrowsAndRepays.borrows.forEach((borrow: any) => {
          totalIncremental = totalIncremental.add(parseFixed(borrow.assets));
        });

        smartPoolBorrowsAndRepays.repays.forEach((repay: any) => {
          totalDecremental = totalDecremental.add(parseFixed(repay.assets));
        });
      }

      amount = formatFixed(totalIncremental.sub(totalDecremental), decimals);

      if (amount && originalAmount && Number(amount) === Number(originalAmount)) return;

      amount && setOriginalAmount(amount);
    } catch (e) {
      console.log(e);
    }

    try {
      if (!depositAmount || !borrowedAmount) return;

      const amountToSubtract = type.value == 'deposit' ? depositAmount : borrowedAmount;

      const difference =
        (Number(formatFixed(amountToSubtract, decimals)) - Number(amount)) / Number(amount);

      setDifference(`${(difference * 100).toFixed(2)}%`);
    } catch (e) {
      console.log(e);
      setDifference('N/A');
    }
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
          <Image
            src={`/img/assets/${symbol.toLowerCase()}.svg`}
            alt={symbol}
            width={40}
            height={40}
          />
        )) || <Skeleton circle height={40} width={40} />}
        <div className={styles.primary}>{(symbol && parseSymbol(symbol)) || <Skeleton />}</div>
      </div>
      <div className={styles.value}>
        {(originalAmount &&
          rate &&
          `$${formatNumber(parseFloat(originalAmount) * rate, 'USD', true)}`) || (
          <Skeleton width={40} />
        )}
      </div>
      {type?.value == 'deposit' && (
        <div className={styles.value}>
          {(eTokenAmount &&
            symbol &&
            `${formatNumber(
              ethers.utils.formatUnits(eTokenAmount, decimals[symbol! as keyof Decimals]),
              symbol
            )}`) || <Skeleton width={40} />}{' '}
        </div>
      )}

      <div className={styles.value}>
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
      </div>

      <div className={styles.value}>{(difference && difference) || <Skeleton width={40} />}</div>

      {type?.value == 'deposit' && (
        <>
          {symbol ? (
            <div className={styles.value}>
              {!loading ? (
                <Tooltip
                  value={
                    disabledText && disabled
                      ? translations[lang][`${disabledText}`]
                      : translations[lang].exitMarket
                  }
                  disableImage
                >
                  <Switch
                    isOn={toggle}
                    handleToggle={() => {
                      setToggle((prev) => !prev);
                      handleMarket();
                    }}
                    id={underlyingData?.address || Math.random().toString()}
                    disabled={disabled}
                  />
                </Tooltip>
              ) : (
                <div className={styles.loadingContainer}>
                  <Loading size="small" color="primary" />
                </div>
              )}
            </div>
          ) : (
            <div className={styles.value}>
              <Skeleton width={40} />
            </div>
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
              onClick={() => {
                setOpen(true);
                setModalContent({
                  market: getFixedLenderData().address,
                  symbol,
                  type: type.value == 'deposit' ? 'smartDeposit' : 'floatingBorrow'
                });
              }}
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
              onClick={() => {
                setOpen(true);
                setModalContent({
                  assets: type.value == 'deposit' ? depositAmount : borrowedAmount,
                  symbol,
                  type: type.value == 'deposit' ? 'withdrawSP' : 'floatingRepay'
                });
              }}
            />
          )) || <Skeleton height={40} />}
        </div>
      </div>
    </div>
  );
}

export default Item;
