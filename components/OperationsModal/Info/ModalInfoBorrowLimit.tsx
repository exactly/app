import React, { useMemo, useContext } from 'react';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { parseFixed, formatFixed } from '@ethersproject/bignumber';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import AccountDataContext from 'contexts/AccountDataContext';

import formatNumber from 'utils/formatNumber';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import ModalInfo, { FromTo, Variant } from 'components/common/modal/ModalInfo';
import { Operation } from 'contexts/ModalStatusContext';

type Props = {
  qty: string;
  symbol: string;
  operation: Operation;
  variant?: Variant;
};

function ModalInfoBorrowLimit({ qty, symbol, operation, variant = 'column' }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const newQty = useMemo(() => {
    if (!accountData || !symbol) return;

    if (!qty) return Zero;

    const { decimals } = accountData[symbol];

    return parseFixed(qty, decimals);
  }, [accountData, symbol, qty]);

  const [beforeBorrowLimit, afterBorrowLimit] = useMemo(() => {
    if (!accountData || !newQty) return [undefined, undefined];

    const { usdPrice, decimals, adjustFactor, isCollateral } = accountData[symbol];

    const beforeBorrowLimitUSD = getBeforeBorrowLimit(accountData[symbol], operation);

    const newQtyUsd = newQty.mul(usdPrice).div(parseFixed('1', decimals));

    const newBeforeBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
    let newAfterBorrowLimit = newBeforeBorrowLimit;

    switch (operation) {
      case 'deposit':
        if (isCollateral) {
          const adjustedDepositBorrowLimit = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.add(adjustedDepositBorrowLimit), 18)).toFixed(
            2,
          );
        } else {
          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        }
        break;

      case 'withdrawAtMaturity':
      case 'depositAtMaturity':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        break;

      case 'withdraw':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'borrow':
      case 'borrowAtMaturity':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'repay':
      case 'repayAtMaturity':
        if (isCollateral) {
          const adjustedRepayBorrowLimit = newQtyUsd.mul(adjustFactor).div(WeiPerEther);

          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.add(adjustedRepayBorrowLimit), 18)).toFixed(2);
        } else {
          newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD, 18)).toFixed(2);
        }
        break;
    }

    return [newBeforeBorrowLimit, newAfterBorrowLimit];
  }, [accountData, symbol, newQty, operation]);

  return (
    <ModalInfo label="Borrow Limit" icon={SwapHorizIcon} variant={variant}>
      <FromTo
        from={beforeBorrowLimit ? `$${formatNumber(beforeBorrowLimit, 'USD')}` : undefined}
        to={afterBorrowLimit ? `$${formatNumber(afterBorrowLimit, 'USD')}` : undefined}
        variant={variant}
      />
    </ModalInfo>
  );
}

export default React.memo(ModalInfoBorrowLimit);
