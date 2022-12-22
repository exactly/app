import React, { useMemo, useContext } from 'react';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { parseFixed, formatFixed } from '@ethersproject/bignumber';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import AccountDataContext from 'contexts/AccountDataContext';

import formatNumber from 'utils/formatNumber';
import getBeforeBorrowLimit from 'utils/getBeforeBorrowLimit';
import { checkPrecision } from 'utils/utils';
import ModalInfo, { FromTo } from '.';
import { Operation } from 'contexts/ModalStatusContext';

type Props = {
  qty: string;
  symbol: string;
  operation: Operation;
};

function ModalRowBorrowLimit({ qty, symbol, operation }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const newQty = useMemo(() => {
    if (!accountData || !symbol) return;

    if (!qty) return Zero;

    const { decimals } = accountData[symbol];

    if (!checkPrecision(qty, decimals)) return;

    return parseFixed(qty, decimals);
  }, [accountData, symbol, qty]);

  const [beforeBorrowLimit, afterBorrowLimit] = useMemo(() => {
    if (!accountData || !newQty) return [undefined, undefined];

    const { usdPrice, decimals, adjustFactor, isCollateral } = accountData[symbol];

    const beforeBorrowLimitUSD = getBeforeBorrowLimit(accountData, symbol, usdPrice, decimals, operation);

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

      case 'withdraw':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'borrow':
        newAfterBorrowLimit = Number(formatFixed(beforeBorrowLimitUSD.sub(newQtyUsd), 18)).toFixed(2);
        break;

      case 'repay':
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
    <ModalInfo label="Borrow Limit" icon={SwapHorizIcon}>
      <FromTo
        from={beforeBorrowLimit ? `$${formatNumber(beforeBorrowLimit, 'usd')}` : undefined}
        to={afterBorrowLimit ? `$${formatNumber(afterBorrowLimit, 'usd')}` : undefined}
      />
    </ModalInfo>
  );
}

export default React.memo(ModalRowBorrowLimit);
