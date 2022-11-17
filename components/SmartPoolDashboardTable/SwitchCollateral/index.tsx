import type { Contract } from '@ethersproject/contracts';
import React, { useContext, useEffect, useState } from 'react';
import { parseFixed } from '@ethersproject/bignumber';

import Loading from 'components/common/Loading';

import FixedLenderContext from 'contexts/FixedLenderContext';
import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';

import keys from '../../SmartPoolUserStatus/Item/translations.json';

import { getSymbol } from 'utils/utils';
import getHealthFactorData from 'utils/getHealthFactorData';
import parseHealthFactor from 'utils/parseHealthFactor';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import StyledSwitch from 'components/Switch';

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

  useEffect(() => {
    if (accountData) {
      checkCollaterals();
    }
  }, [accountData, walletAddress]);

  // TODO: extract
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
    return <Skeleton animation="wave" width={60} height={30} sx={{ margin: 'auto' }} />;
  }

  if (loading) {
    return <Loading size="small" color="primary" />;
  }

  return (
    <Tooltip
      title={
        <Typography fontSize="1.2em" fontWeight={600}>
          {!toggle
            ? translations[lang].enterMarket
            : disabledText && disabled
            ? translations[lang][`${disabledText}`]
            : translations[lang].exitMarket}
        </Typography>
      }
      placement="top"
      arrow
    >
      <div>
        <StyledSwitch
          checked={toggle}
          onChange={() => {
            setToggle((prev) => !prev);
            handleMarket();
          }}
          inputProps={{ 'aria-label': 'controlled' }}
          disabled={disabled}
          defaultChecked
        />
      </div>
    </Tooltip>
  );
}

export default SwitchCollateral;
