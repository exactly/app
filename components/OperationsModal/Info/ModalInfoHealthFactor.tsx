import React, { useContext, useMemo } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { WeiPerEther, Zero } from '@ethersproject/constants';

import { HealthFactor } from 'types/HealthFactor';

import parseHealthFactor from 'utils/parseHealthFactor';
import getHealthFactorData from 'utils/getHealthFactorData';

import AccountDataContext from 'contexts/AccountDataContext';
import { Operation } from 'contexts/ModalStatusContext';
import { checkPrecision } from 'utils/utils';

import ModalInfo, { FromTo } from 'components/common/modal/ModalInfo';

type Props = {
  qty: string;
  symbol: string;
  operation: Operation;
};

function ModalInfoHealthFactor({ qty, symbol, operation }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const newQty = useMemo(() => {
    if (!accountData || !symbol) return;

    if (!qty) return Zero;

    const { decimals } = accountData[symbol];

    if (!checkPrecision(qty, decimals)) return;

    return parseFixed(qty, decimals);
  }, [accountData, symbol, qty]);

  const {
    beforeHealthFactor,
    healthFactor,
  }:
    | { beforeHealthFactor: undefined; healthFactor: undefined }
    | { beforeHealthFactor: string; healthFactor: HealthFactor } = useMemo(() => {
    if (!accountData) return {};

    const hf: HealthFactor = getHealthFactorData(accountData);

    return {
      beforeHealthFactor: parseHealthFactor(hf.debt, hf.collateral),
      healthFactor: hf,
    };
  }, [accountData]);

  const afterHealthFactor = useMemo(() => {
    if (!accountData || !newQty || !healthFactor) return;

    const { adjustFactor, usdPrice, isCollateral, decimals } = accountData[symbol];

    const newQtyUsd = newQty.mul(usdPrice).div(parseFixed('1', decimals));

    switch (operation) {
      case 'deposit': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral.add(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }
      case 'withdraw': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(WeiPerEther).div(adjustFactor);

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }
      case 'borrow': {
        const adjustedNewQtyUsd = newQtyUsd.mul(WeiPerEther).div(adjustFactor);

        return parseHealthFactor(healthFactor.debt.add(adjustedNewQtyUsd), healthFactor.collateral);
      }
      case 'repay': {
        const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

        return parseHealthFactor(healthFactor.debt, healthFactor.collateral.add(adjustedNewQtyUsd));
      }
    }
  }, [healthFactor, newQty, accountData, operation, symbol]);

  return (
    <ModalInfo label="Health Factor" icon={FavoriteBorderOutlinedIcon}>
      <FromTo from={beforeHealthFactor} to={afterHealthFactor} />
    </ModalInfo>
  );
}

export default React.memo(ModalInfoHealthFactor);
