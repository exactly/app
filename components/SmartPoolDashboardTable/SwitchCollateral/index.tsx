import type { Contract } from '@ethersproject/contracts';
import React, { useContext, useEffect, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import Skeleton from 'react-loading-skeleton';

import Switch from 'components/common/Switch';
import Loading from 'components/common/Loading';
import Tooltip from 'components/Tooltip';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';

import styles from '../../SmartPoolUserStatus/Item/style.module.scss';

import keys from '../../SmartPoolUserStatus/Item/translations.json';

import { getSymbol, getUnderlyingData } from 'utils/utils';
import getHealthFactorData from 'utils/getHealthFactorData';
import parseHealthFactor from 'utils/parseHealthFactor';

type Props = {
  symbol: string | undefined;
  walletAddress: string | null | undefined;
  auditorContract: Contract | undefined;
};

function SwitchCollateral({ symbol, walletAddress, auditorContract }: Props) {
  const { network } = useWeb3Context();
  const fixedLender = useContext(FixedLenderContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [disabledText, setDisabledText] = useState<string | undefined>(undefined);

  const underlyingData = getUnderlyingData(network?.name, symbol);

  useEffect(() => {
    if (accountData) {
      checkCollaterals();
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

  if (!symbol) {
    return (
      <div className={styles.value}>
        <Skeleton width={40} />
      </div>
    );
  }

  return (
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
  );
}

export default SwitchCollateral;
