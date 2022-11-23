import type { Contract } from '@ethersproject/contracts';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import Loading from 'components/common/Loading';

import AccountDataContext from 'contexts/AccountDataContext';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';

import { Skeleton, Tooltip, Typography } from '@mui/material';
import StyledSwitch from 'components/Switch';
import parseHealthFactor from 'utils/parseHealthFactor';
import { getSymbol } from 'utils/utils';
import { HealthFactor } from 'types/HealthFactor';
import { WeiPerEther } from '@ethersproject/constants';

type Props = {
  symbol?: string;
  walletAddress?: string;
  auditorContract?: Contract;
  healthFactor?: HealthFactor;
};

function SwitchCollateral({ symbol, walletAddress, auditorContract, healthFactor }: Props) {
  const { network } = useWeb3Context();
  const fixedLender = useContext(FixedLenderContext);
  const { accountData, getAccountData } = useContext(AccountDataContext);

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [disabledText, setDisabledText] = useState<string | undefined>();

  const checkCollaterals = useCallback(() => {
    if (!accountData || !symbol) return;
    setToggle(false);
    setDisabled(false);

    const { [symbol]: currentMarket } = accountData;
    const floatingPositions = currentMarket.floatingBorrowAssets;
    const fixedPositions = currentMarket.fixedBorrowPositions;

    if (!floatingPositions.isZero() || fixedPositions.length > 0) {
      setDisabledText(`You can't disable collateral on this asset because you have an active borrow`);
      setDisabled(true);
    }

    if (currentMarket.isCollateral) {
      setToggle(true);
      if (!healthFactor) return;

      const usdPrice = currentMarket.usdPrice;
      const collateralAssets = currentMarket.floatingDepositAssets;
      const collateralUsd = collateralAssets.mul(usdPrice).div(WeiPerEther);

      const newHF = parseFloat(parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(collateralUsd)));

      if (newHF < 1) {
        setDisabledText('Disabling this collateral will make your health factor less than 1');
      }
    }
  }, [accountData, healthFactor, symbol]);

  useEffect(() => {
    checkCollaterals();
  }, [accountData, walletAddress, healthFactor, checkCollaterals]);

  // TODO: refactor, use new hook
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
            ? 'Enable this asset as collateral'
            : disabledText && disabled
            ? disabledText
            : 'Disabling this asset as collateral affects your borrowing power and Health Factor'}
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
        />
      </div>
    </Tooltip>
  );
}

export default SwitchCollateral;
