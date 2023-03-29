import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import { Operation } from 'contexts/ModalStatusContext';
import interestRateCurve from 'utils/interestRateCurve';
import useAccountData from './useAccountData';

export default (operation: Operation, symbol: string, qty: string): number | undefined => {
  const { marketAccount } = useAccountData(symbol);

  if (!marketAccount || operation !== 'borrow') return undefined;
  const { totalFloatingDepositAssets, totalFloatingBorrowAssets, decimals } = marketAccount;

  const decimalWAD = parseFixed('1', decimals);
  const delta = parseFixed(qty || '0', decimals);

  const deposited = totalFloatingDepositAssets ?? Zero;
  const borrowed = (totalFloatingBorrowAssets ?? Zero).add(delta);

  const t = borrowed.mul(decimalWAD).div(deposited);
  const toUtilization = Number(formatFixed(t, decimals));

  const { interestRateModel } = marketAccount;
  const { A, B, UMax } = {
    A: interestRateModel.floatingCurveA,
    B: interestRateModel.floatingCurveB,
    UMax: interestRateModel.floatingMaxUtilization,
  };

  const curve = interestRateCurve(Number(A) / 1e18, Number(B) / 1e18, Number(UMax) / 1e18);
  const rate = curve(toUtilization);

  return rate;
};
