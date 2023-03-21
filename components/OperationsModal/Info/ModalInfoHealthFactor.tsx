import React, { useMemo } from 'react';
import { parseFixed } from '@ethersproject/bignumber';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { useTranslation } from 'react-i18next';

import parseHealthFactor from 'utils/parseHealthFactor';

import { Operation } from 'contexts/ModalStatusContext';

import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';

type Props = {
  qty: string;
  symbol: string;
  operation: Operation;
  variant?: Variant;
};

function ModalInfoHealthFactor({ qty, symbol, operation, variant = 'column' }: Props) {
  const { t } = useTranslation();
  const { marketAccount } = useAccountData(symbol);

  const healthFactor = useHealthFactor();

  const newQty = useMemo(() => {
    if (!marketAccount) return;

    if (!qty) return Zero;

    return parseFixed(qty, marketAccount.decimals);
  }, [marketAccount, qty]);

  const beforeHealthFactor = useMemo<string | undefined>(() => {
    if (!healthFactor) return;
    return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
  }, [healthFactor]);

  const afterHealthFactor = useMemo(() => {
    if (!marketAccount || !newQty || !healthFactor) return;

    const { adjustFactor, usdPrice, isCollateral, decimals } = marketAccount;

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

      case 'depositAtMaturity': {
        return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
      }

      case 'withdraw': {
        if (isCollateral) {
          const adjustedNewQtyUsd = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(adjustedNewQtyUsd));
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }

      case 'withdrawAtMaturity': {
        return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
      }

      case 'borrowAtMaturity':
      case 'borrow': {
        const adjustedNewQtyUsd = newQtyUsd.mul(WeiPerEther).div(adjustFactor);
        return parseHealthFactor(healthFactor.debt.add(adjustedNewQtyUsd), healthFactor.collateral);
      }

      case 'repayAtMaturity':
      case 'repay': {
        const adjustedNewQtyUsd = newQtyUsd.mul(WeiPerEther).div(adjustFactor);

        return parseHealthFactor(healthFactor.debt.sub(adjustedNewQtyUsd), healthFactor.collateral);
      }
    }
  }, [healthFactor, newQty, marketAccount, operation]);

  return (
    <ModalInfo label={t('Your Health Factor')} icon={FavoriteBorderOutlinedIcon} variant={variant}>
      <FromTo from={beforeHealthFactor} to={afterHealthFactor} variant={variant} />
    </ModalInfo>
  );
}

export default React.memo(ModalInfoHealthFactor);
