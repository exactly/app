import type { Contract } from '@ethersproject/contracts';
import type { BigNumber } from '@ethersproject/bignumber';
import React, { useContext, useEffect, useState } from 'react';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import Skeleton from 'react-loading-skeleton';
import Image from 'next/image';

import Button from 'components/common/Button';
import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';
import Tooltip from 'components/Tooltip';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import { getSymbol, getUnderlyingData } from 'utils/utils';
import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import getHealthFactorData from 'utils/getHealthFactorData';
import parseHealthFactor from 'utils/parseHealthFactor';

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
  market,
}: Props) {
  const { network } = useWeb3Context();
  const fixedLender = useContext(FixedLenderContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [rate, setRate] = useState<number | undefined>(undefined);
  const [disabledText, setDisabledText] = useState<string | undefined>(undefined);

  const underlyingData = getUnderlyingData(network?.name, symbol);

  useEffect(() => {
    if (accountData) {
      checkCollaterals();
      getExchangeRate();
    }
  }, [accountData, walletAddress]);

  async function checkCollaterals() {
    if (!accountData || !symbol) return;
    setToggle(false);
    setDisabled(false);

    const floatingPositions = accountData[symbol].floatingBorrowAssets;
    const fixedPositions = accountData[symbol].fixedBorrowPositions;

    if (!floatingPositions.isZero() || fixedPositions.length > 0) {
      setDisabledText('activeBorrow');
      setDisabled(true);
    }

    if (accountData[symbol].isCollateral) {
      setToggle(true);

      const healthFactor = await getHealthFactorData(accountData);
      const usdPrice = accountData[symbol].usdPrice;
      const collateralAssets = accountData[symbol].floatingDepositAssets;
      const WAD = parseFixed('1', 18);
      const collateralUsd = collateralAssets.mul(usdPrice).div(WAD);

      const newHF = parseFloat(parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(collateralUsd)));

      if (newHF < 1) {
        setDisabledText('underCollateral');
      }
    }
  }

  function getExchangeRate() {
    if (!accountData || !symbol) return;
    const data = accountData;
    const exchangeRate = parseFloat(formatFixed(data[symbol].usdPrice, 18));
    setRate(exchangeRate);
  }

  function getFixedLenderData() {
    const filteredFixedLender = fixedLender.find((contract) => {
      const contractSymbol = getSymbol(contract.address!, network!.name);

      return contractSymbol === symbol;
    });

    const fixedLenderData = {
      address: filteredFixedLender?.address,
      abi: filteredFixedLender?.abi,
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

      getAccountData();
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
        {(symbol && <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={20} height={20} />) || (
          <Skeleton circle height={20} width={20} />
        )}
        <div className={styles.primary}>{(symbol && formatSymbol(symbol)) || <Skeleton />}</div>
      </div>
      {/* <div className={styles.value}>
        {(originalAmount &&
          rate &&
          `$${formatNumber(parseFloat(originalAmount) * rate, 'USD', true)}`) || (
          <Skeleton width={40} />
        )}
      </div> */}

      <div className={styles.value}>
        {(depositAmount &&
          borrowedAmount &&
          symbol &&
          rate &&
          `$${formatNumber(
            parseFloat(
              formatFixed(type?.value === 'deposit' ? depositAmount : borrowedAmount, accountData?.[symbol].decimals),
            ) * rate,
            'USD',
            true,
          )}`) || <Skeleton width={40} />}
      </div>

      {type?.value === 'deposit' && (
        <div className={styles.value}>
          {(eTokenAmount &&
            symbol &&
            `${formatNumber(formatFixed(eTokenAmount, accountData?.[symbol].decimals), symbol)}`) || (
            <Skeleton width={40} />
          )}{' '}
        </div>
      )}

      {/* <div className={styles.value}>{(difference && difference) || <Skeleton width={40} />}</div> */}

      {type?.value === 'deposit' && (
        <>
          {symbol ? (
            <div>
              {!loading ? (
                <Tooltip
                  value={
                    !toggle
                      ? translations[lang].enterMarket
                      : disabledText && disabled
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
              text={type.value === 'deposit' ? translations[lang].deposit : translations[lang].borrow}
              className={'primary'}
              onClick={() => {
                setMarket({ value: market! });
                setOperation(type.value as Operation);
                setOpen(true);
              }}
            />
          )) || <Skeleton height={40} />}
        </div>

        <div className={styles.buttonContainer}>
          {(symbol && type && (
            <Button
              text={type.value === 'deposit' ? translations[lang].withdraw : translations[lang].repay}
              className={'tertiary'}
              onClick={() => {
                setMarket({ value: market! });
                setOperation(type.value === 'deposit' ? 'withdraw' : 'repay');
                setOpen(true);
              }}
            />
          )) || <Skeleton height={40} />}
        </div>
      </div>
    </div>
  );
}

export default Item;
