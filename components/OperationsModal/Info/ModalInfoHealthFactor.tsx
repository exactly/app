import React, { useMemo } from 'react';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useTranslation } from 'react-i18next';
import { parseUnits } from 'viem';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import parseHealthFactor from 'utils/parseHealthFactor';

import type { Operation } from 'types/Operation';

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

    if (!qty) return 0n;

    return parseUnits(qty, marketAccount.decimals);
  }, [marketAccount, qty]);

  const beforeHealthFactor = useMemo<string | undefined>(() => {
    if (!healthFactor) return;
    return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
  }, [healthFactor]);

  const afterHealthFactor = useMemo(() => {
    if (!marketAccount || !newQty || !healthFactor) return;

    const { adjustFactor, usdPrice, isCollateral, decimals } = marketAccount;

    const wad = parseUnits('1', decimals);
    const newQtyUsd = (newQty * usdPrice) / wad;

    switch (operation) {
      case 'deposit': {
        if (isCollateral) {
          const adjustedNewQtyUsd = (newQtyUsd * adjustFactor) / WAD;

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral + adjustedNewQtyUsd);
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }

      case 'depositAtMaturity': {
        return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
      }

      case 'withdraw': {
        if (isCollateral) {
          const adjustedNewQtyUsd = (newQtyUsd * adjustFactor) / WAD;

          return parseHealthFactor(healthFactor.debt, healthFactor.collateral - adjustedNewQtyUsd);
        } else {
          return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
        }
      }

      case 'withdrawAtMaturity': {
        return parseHealthFactor(healthFactor.debt, healthFactor.collateral);
      }

      case 'borrowAtMaturity':
      case 'borrow': {
        const adjustedNewQtyUsd = (newQtyUsd * WAD) / adjustFactor;
        return parseHealthFactor(healthFactor.debt + adjustedNewQtyUsd, healthFactor.collateral);
      }

      case 'repayAtMaturity':
      case 'repay': {
        const adjustedNewQtyUsd = (newQtyUsd * WAD) / adjustFactor;

        return parseHealthFactor(healthFactor.debt - adjustedNewQtyUsd, healthFactor.collateral);
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
